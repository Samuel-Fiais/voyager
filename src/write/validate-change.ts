import { auditLines, rawValues, splitFrontmatter } from '@/vault/text'
import {
  AGENT,
  buildLinkIndex,
  isNotePath,
  ISO,
  loadRules,
  validateNote,
  type VaultFiles,
  type VaultRules,
} from '@/vault/validate'

// Validação antes do commit (R09): as regras de arquivo do validar-vault.py nos arquivos tocados
// e as regras de alteração do modo --staged (auditoria append-only, linha nova, updated_at).

export interface FileChange {
  path: string
  /** conteúdo anterior (null = arquivo novo) */
  before: string | null
  /** conteúdo novo (null = apagar) */
  after: string | null
  /** anexo binário novo (base64), quando não é texto */
  base64?: string
}

const AUDIT_LINE = /^- `([^`]+)` \| ([^|]+?) \| /

/** Porta de validate_staged() do validar-vault.py para um arquivo alterado. */
export function stagedErrors(path: string, before: string, after: string): string[] {
  const errors: string[] = []
  const fb = splitFrontmatter(before)
  const fa = splitFrontmatter(after)
  const lb = auditLines(fb.body) ?? []
  const la = auditLines(fa.body) ?? []
  if (lb.length && JSON.stringify(la.slice(0, lb.length)) !== JSON.stringify(lb)) {
    return [`${path}: ## Auditoria é append-only; linha antiga apagada, alterada ou reordenada`]
  }
  const added = la.slice(lb.length)
  if (fb.fm !== null && fa.fm !== null && before !== after) {
    if (!added.length)
      errors.push(`${path}: alterado sem nova linha em ## Auditoria (contrato de auditoria)`)
    if (rawValues(fa.fm).updated_at === rawValues(fb.fm).updated_at && added.length) {
      errors.push(`${path}: updated_at não foi atualizado`)
    }
  }
  for (const l of added) {
    const m = l.match(AUDIT_LINE)
    if (!m)
      errors.push(
        `${path}: linha de auditoria fora do formato \`quando\` | quem | ação | de | para | nota: ${l.slice(0, 80)}`,
      )
    else if (!ISO.test(m[1])) errors.push(`${path}: quando '${m[1]}' não é ISO 8601 com timezone`)
    else if (m[2].startsWith('agent:') && !AGENT.test(m[2])) {
      errors.push(`${path}: ator '${m[2]}' inválido: use agent:<nome-em-minúsculas>`)
    }
  }
  return errors
}

export function applyChanges(files: VaultFiles, changes: FileChange[]): VaultFiles {
  const next = new Map(files)
  for (const c of changes) {
    if (c.after === null && !c.base64) next.delete(c.path)
    else next.set(c.path, c.base64 ? null : c.after)
  }
  return next
}

/** Erros que impedem o commit, só dos arquivos tocados. */
export function validateChanges(
  files: VaultFiles,
  changes: FileChange[],
  rules: VaultRules = loadRules(files),
): string[] {
  const next = applyChanges(files, changes)
  const links = buildLinkIndex(next.keys())
  const errors: string[] = []
  const codes = new Map<string, string[]>()
  for (const [p, text] of next) {
    if (text === null || !isNotePath(p)) continue
    const m = text.match(/^---\n[\s\S]*?^code:\s*"?([^"\n]+?)"?\s*$/m)
    if (m) codes.set(m[1], [...(codes.get(m[1]) ?? []), p])
  }
  for (const c of changes) {
    if (c.after === null || c.base64 || !c.path.endsWith('.md')) continue
    if (isNotePath(c.path)) {
      const r = validateNote(c.path, c.after, rules, links)
      errors.push(...r.errors)
      if (r.code && (codes.get(r.code)?.length ?? 0) > 1) {
        errors.push(
          `${c.path}: code '${r.code}' duplicado em: ${codes
            .get(r.code)!
            .filter((p) => p !== c.path)
            .join('; ')}`,
        )
      }
    }
    if (c.before !== null) errors.push(...stagedErrors(c.path, c.before, c.after))
  }
  return errors
}
