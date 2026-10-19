import { parse as parseYaml } from 'yaml'
import {
  codePatterns,
  parseContracts,
  parseTemplates,
  ENTITY_CONTRACT,
  TASK_CONTRACT,
  type Contracts,
} from './contracts'
import {
  auditLines,
  basename,
  dirname,
  join,
  markdownLinkTargets,
  nfc,
  normpath,
  rawValues,
  splitFrontmatter,
  wikilinkTargets,
} from './text'

// Porta para TypeScript das regras de arquivo do Skills/scripts/validar-vault.py (R09).
// Mesmas mensagens, para comparar resultados com o script.

const SKIP_DIRS = new Set(['.git', '.obsidian', '.trash', 'Skills', 'node_modules'])
const NO_FM_ALLOWED = new Set(['README.md', 'SETUP.md'])
const ROOT_DOCS = new Set(['README.md', 'SETUP.md'])
const AUDIT_PROPS = ['created_by', 'created_at', 'updated_by', 'updated_at']
export const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})$/
export const AGENT = /^agent:[a-z0-9][a-z0-9_-]*$/
const FIXED_PATH_TYPES = new Set(['task_provider_configuration'])
const SKILL_ONLY_TYPES = new Set(['status_change_checklist', 'sync_checklist'])

/** Arquivos do vault: caminho → texto (null para binário). */
export type VaultFiles = Map<string, string | null>

export interface LinkIndex {
  byPath: Set<string>
  byName: Map<string, string[]>
}

export function isNotePath(path: string) {
  const top = path.includes('/') ? path.split('/')[0] : '.'
  return path.endsWith('.md') && !SKIP_DIRS.has(top)
}

export function buildLinkIndex(paths: Iterable<string>): LinkIndex {
  const byPath = new Set<string>()
  const byName = new Map<string, string[]>()
  const push = (k: string, p: string) => byName.set(k, [...(byName.get(k) ?? []), p])
  for (const raw of [...paths].sort()) {
    const p = nfc(raw)
    byPath.add(p)
    if (p.endsWith('.md')) byPath.add(p.slice(0, -3))
    const base = basename(p)
    push(base, p)
    if (base.endsWith('.md')) push(base.slice(0, -3), p)
  }
  return { byPath, byName }
}

/** Resolve um wikilink como o Obsidian e o validador: caminho completo, relativo ou nome. */
export function resolveWikilink(
  target: string,
  note: string,
  idx: LinkIndex,
): string | 'self' | null {
  const t = nfc(target.split('#')[0].split('^')[0].trim().replace(/\\+$/, ''))
  if (!t) return 'self'
  if (idx.byPath.has(t)) return t
  const rel = normpath(join(dirname(note), t))
  if (idx.byPath.has(rel)) return rel
  const hits = idx.byName.get(basename(t)) ?? []
  if (
    hits.length &&
    (!t.includes('/') || hits.some((h) => h.endsWith(t) || h.endsWith(`${t}.md`)))
  ) {
    return hits[0]
  }
  return null
}

export interface ValidationResult {
  errors: string[]
  /** type → status → quantidade (como `validar-vault.py --report`) */
  report: Map<string, Map<string, number>>
  notes: number
}

export interface VaultRules {
  contracts: Contracts
  codePats: Map<string, RegExp[]>
}

export function loadRules(files: VaultFiles): VaultRules {
  const contracts = parseContracts(files.get(ENTITY_CONTRACT) ?? '', files.get(TASK_CONTRACT) ?? '')
  const texts = [...files].filter((e): e is [string, string] => e[1] !== null)
  return { contracts, codePats: codePatterns(parseTemplates(texts)) }
}

function pyStr(v: unknown): string {
  if (v === null || v === undefined) return 'None'
  if (v === true) return 'True'
  if (v === false) return 'False'
  return String(v)
}

function stripQuotes(v: string) {
  return v.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '')
}

/** Regras de um arquivo (frontmatter, code, auditoria, vínculos). Devolve os erros e o par type/status. */
export function validateNote(
  path: string,
  text: string,
  rules: VaultRules,
  links: LinkIndex,
): { errors: string[]; type?: string; status?: string; code?: string } {
  const errors: string[] = []
  const err = (msg: string) => errors.push(`${path}: ${msg}`)
  const { allowed } = rules.contracts
  const { fm, body } = splitFrontmatter(text)
  const base = basename(path)

  for (const t of wikilinkTargets(text)) {
    const r = resolveWikilink(t, path, links)
    if (r === null) err(`wikilink quebrado [[${t}]]`)
    else if (
      r !== 'self' &&
      !ROOT_DOCS.has(path) &&
      (r.startsWith('Skills/') || ROOT_DOCS.has(r))
    ) {
      err(`registro real não pode ligar a Skills/ nem à raiz: [[${t}]] (contrato de vínculos)`)
    }
  }
  for (const t of markdownLinkTargets(text)) {
    if (/^(https?:|mailto:|#|obsidian:|\/)/.test(t)) continue
    let decoded = t.split('#')[0]
    try {
      decoded = decodeURIComponent(decoded)
    } catch {
      // mantém o texto cru
    }
    const dest = nfc(normpath(join(dirname(path), decoded)))
    if (!links.byPath.has(dest)) err(`link Markdown quebrado (${t})`)
    else if (!ROOT_DOCS.has(path) && (dest.startsWith('Skills/') || ROOT_DOCS.has(dest))) {
      err(`registro real não pode ligar a Skills/ nem à raiz: (${t}) (contrato de vínculos)`)
    }
  }
  if (fm === null) {
    if (!NO_FM_ALLOWED.has(base)) {
      err(
        'sem frontmatter (só README.md e SETUP.md podem ficar sem); se for resíduo de exportação, remova',
      )
    }
    return { errors }
  }
  let data: Record<string, unknown>
  try {
    const parsed: unknown = parseYaml(fm, { version: '1.1' }) ?? {}
    if (typeof parsed !== 'object' || Array.isArray(parsed))
      throw new Error('frontmatter não é um mapa')
    data = parsed as Record<string, unknown>
  } catch (e) {
    err(`frontmatter YAML inválido: ${String((e as Error).message).split('\n')[0]}`)
    return { errors }
  }
  const rv = rawValues(fm)
  const type = data.type
  const status = data.status
  const result: { errors: string[]; type?: string; status?: string; code?: string } = {
    errors,
    type: pyStr(type),
    status: pyStr(status),
  }
  for (const k of ['type', 'status']) {
    const first = (rv[k] ?? '').slice(0, 1)
    if (first === "'" || first === '"') err(`${k} entre aspas (${rv[k]}); use valor sem aspas`)
  }
  if (!type) {
    err('sem type')
    return result
  }
  const typeStr = pyStr(type)
  const permitted = allowed.get(typeStr)
  if (!permitted) err(`type '${typeStr}' fora do contrato de status de entidades`)
  else if (status === null || status === undefined) {
    err(`sem status (permitidos para ${typeStr}: ${[...permitted].sort().join(', ')})`)
  } else if (!permitted.has(pyStr(status))) {
    err(
      `status '${pyStr(status)}' não permitido para ${typeStr} (permitidos: ${[...permitted].sort().join(', ')})`,
    )
  }
  const code = data.code
  if (!code) err('sem code')
  else {
    const c = pyStr(code)
    result.code = c
    if (!FIXED_PATH_TYPES.has(typeStr) && !(base === `${c}.md` || base.startsWith(`${c} - `))) {
      err(`nome do arquivo não começa com o code '${c} - '`)
    }
    const pats = rules.codePats.get(typeStr)
    if (pats?.length && !pats.some((rx) => rx.test(c)))
      err(`code '${c}' fora do padrão do template de ${typeStr}`)
  }
  for (const k of AUDIT_PROPS) {
    const v = stripQuotes(rv[k] ?? '')
    if (!v) err(`sem ${k} (contrato de auditoria)`)
    else if (k.endsWith('_at') && !ISO.test(v)) err(`${k} '${v}' não é ISO 8601 com timezone`)
    else if (k.endsWith('_by') && v.startsWith('agent:') && !AGENT.test(v)) {
      err(`${k} '${v}' inválido: use agent:<nome-em-minúsculas>`)
    }
  }
  const al = auditLines(body)
  if (al === null) err('sem seção ## Auditoria')
  else if (!al.length) err('## Auditoria sem nenhuma linha')
  return result
}

/** Templates, exemplos e SKILL.md não podem ensinar type/status fora do contrato. */
export function validateSkills(files: VaultFiles, rules: VaultRules): string[] {
  const errors: string[] = []
  const { allowed } = rules.contracts
  for (const [p, text] of files) {
    if (!p.startsWith('Skills/') || !p.endsWith('.md') || text === null) continue
    const dir = dirname(p)
    const f = basename(p)
    if (dir.endsWith('/assets')) {
      const { fm } = splitFrontmatter(text)
      if (fm === null) continue
      const rv = rawValues(fm)
      const t = (rv.type ?? '').replace(/^"|"$/g, '')
      const st = (rv.status ?? '').replace(/^"|"$/g, '')
      if (!t || SKILL_ONLY_TYPES.has(t)) continue
      const perm = allowed.get(t)
      if (!perm)
        errors.push(
          `${p}: template/exemplo usa type '${t}' fora do contrato de status de entidades`,
        )
      else if (!st)
        errors.push(
          `${p}: template/exemplo sem status (permitidos para ${t}: ${[...perm].sort().join(', ')})`,
        )
      else if (!st.includes('{{') && !perm.has(st))
        errors.push(`${p}: template/exemplo usa status '${st}' não permitido para ${t}`)
      for (const k of ['type', 'status']) {
        const first = (rv[k] ?? '').slice(0, 1)
        if (first === "'" || first === '"')
          errors.push(`${p}: ${k} entre aspas no template/exemplo`)
      }
      const c = (rv.code ?? '').replace(/^"|"$/g, '')
      const pats = rules.codePats.get(t)
      if (f.startsWith('exemplo') && c && pats?.length && !pats.some((rx) => rx.test(c))) {
        errors.push(`${p}: exemplo com code '${c}' fora do padrão do template de ${t}`)
      }
    } else if (f === 'SKILL.md') {
      for (const m of text.matchAll(/\btype: ?`?([a-z_]+)`?/g)) {
        if (!allowed.has(m[1]) && !SKILL_ONLY_TYPES.has(m[1])) {
          errors.push(`${p}: cita type '${m[1]}' fora do contrato de status de entidades`)
        }
      }
    }
  }
  return errors
}

/** Validação do vault inteiro (equivale a `validar-vault.py` sem --staged). */
export function validateVault(files: VaultFiles, rules = loadRules(files)): ValidationResult {
  const links = buildLinkIndex(files.keys())
  const errors: string[] = []
  const report = new Map<string, Map<string, number>>()
  const codes = new Map<string, string[]>()
  const notes = [...files.keys()].filter(isNotePath).map(nfc).sort()
  for (const p of notes) {
    const text = files.get(p) ?? ''
    const r = validateNote(p, text, rules, links)
    errors.push(...r.errors)
    if (r.type !== undefined) {
      const byStatus = report.get(r.type) ?? new Map<string, number>()
      byStatus.set(r.status!, (byStatus.get(r.status!) ?? 0) + 1)
      report.set(r.type, byStatus)
    }
    if (r.code) codes.set(r.code, [...(codes.get(r.code) ?? []), p])
  }
  for (const [c, ps] of codes) {
    if (ps.length > 1) errors.push(`${ps[0]}: code '${c}' duplicado em: ${ps.slice(1).join('; ')}`)
  }
  errors.push(...validateSkills(files, rules))
  return { errors, report, notes: notes.length }
}

/** Relatório no formato do `validar-vault.py --report`. */
export function formatReport(result: ValidationResult, rules: VaultRules): string {
  const lines: string[] = []
  for (const t of [...result.report.keys()].sort()) {
    const byStatus = result.report.get(t)!
    const perm = rules.contracts.allowed.get(t)
    const total = [...byStatus.values()].reduce((a, b) => a + b, 0)
    const parts = [...byStatus.entries()]
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([s, n]) => `${s}=${n}${!perm || perm.has(s) ? '' : ' (fora)'}`)
    lines.push(`${t}: ${total} | ${parts.join(', ')}`)
  }
  return lines.join('\n')
}
