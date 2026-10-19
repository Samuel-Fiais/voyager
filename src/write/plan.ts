import type { Note, VaultIndex } from '@/vault/vault-index'
import { appendAudit, auditLine } from './audit-line'
import { frontmatterLines, setField } from './frontmatter'
import { checkTransition } from './status-rules'
import { nowISO } from './time'
import { validateChanges, type FileChange } from './validate-change'

// Uma alteração planejada: o que muda, como fica a auditoria e a mensagem do commit (R10).

export interface WritePlan {
  title: string
  changes: FileChange[]
  /** linhas de diff do frontmatter (`- ` e `+ `) por arquivo, para a folha de confirmação */
  diffs: { path: string; lines: string[] }[]
  auditLines: { path: string; line: string }[]
  message: string
  /** erros de validação (R09) ou de regra (R05, R06); com erro não há commit */
  errors: string[]
  /** nota a abrir depois do commit (ex.: nota criada) */
  openAfter?: string
}

export function frontmatterDiff(before: string, after: string): string[] {
  const a = frontmatterLines(before)
  const b = frontmatterLines(after)
  const out: string[] = []
  const max = Math.max(a.length, b.length)
  const setA = new Set(a)
  const setB = new Set(b)
  for (let i = 0; i < max; i++) {
    if (a[i] !== undefined && !setB.has(a[i])) out.push(`- ${a[i]}`)
    if (b[i] !== undefined && !setA.has(b[i])) out.push(`+ ${b[i]}`)
  }
  return out
}

export interface StatusChangeInput {
  index: VaultIndex
  note: Note
  to: string
  reason: string
  actor: string
  now?: string
}

export function planStatusChange({
  index,
  note,
  to,
  reason,
  actor,
  now = nowISO(),
}: StatusChangeInput): WritePlan {
  const from = note.status ?? '—'
  const check = checkTransition(index, note, to)
  const errors: string[] = []
  if (!check.allowed && check.rule) errors.push(check.rule)
  if (check.reasonRequired && !reason.trim())
    errors.push('Esta transição exige o motivo, que vai para a evidência da auditoria.')

  let after = note.text
  after = setField(after, 'status', to)
  after = setField(after, 'updated_by', actor)
  after = setField(after, 'updated_at', now)
  const line = auditLine({
    when: now,
    who: actor,
    action: 'status_change',
    from,
    to,
    evidence: reason.trim() || `mudança de status`,
  })
  after = appendAudit(after, line)
  const changes: FileChange[] = [{ path: note.path, before: note.text, after }]
  if (!errors.length) errors.push(...validateChanges(index.files, changes))
  return {
    title: `${note.code ?? note.name}: ${from} → ${to}`,
    changes,
    diffs: [{ path: note.path, lines: frontmatterDiff(note.text, after) }],
    auditLines: [{ path: note.path, line }],
    message: `${note.code ?? note.name}: ${from} → ${to} (via Voyager)`,
    errors,
  }
}
