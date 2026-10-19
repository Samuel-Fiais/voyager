// Linhas da seção ## Auditoria: `quando` | quem | ação | de | para | evidência

export interface AuditEntry {
  when: string
  who: string
  action: string
  from: string
  to: string
  evidence: string
  raw: string
}

export function parseAuditLine(line: string): AuditEntry | null {
  const m = line.match(/^- `([^`]+)` \| (.*)$/)
  if (!m) return null
  const parts = m[2].split(' | ')
  if (parts.length < 4) return null
  const [who, action, from, to, ...rest] = parts
  return {
    when: m[1],
    who: who.trim(),
    action: action.trim(),
    from: (from ?? '').trim(),
    to: (to ?? '').trim(),
    evidence: rest.join(' | ').trim(),
    raw: line,
  }
}

export function timeOf(entry: AuditEntry): number {
  const t = Date.parse(entry.when)
  return Number.isNaN(t) ? 0 : t
}
