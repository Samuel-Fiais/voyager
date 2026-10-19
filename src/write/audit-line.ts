// Linha de auditoria do contrato: `quando` | quem | ação | de | para | evidência (via Voyager)

export interface AuditInput {
  when: string
  who: string
  action: string
  from: string
  to: string
  evidence: string
}

export const VIA = '(via Voyager)'

function clean(s: string) {
  // a barra separa colunas; quebras de linha não cabem numa linha de auditoria
  return s
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s\|\s/g, ' / ')
    .trim()
}

export function auditLine(a: AuditInput): string {
  const evidence = clean(a.evidence)
  const ev = evidence.endsWith(VIA) ? evidence : `${evidence ? `${evidence} ` : ''}${VIA}`
  return `- \`${a.when}\` | ${clean(a.who)} | ${a.action} | ${clean(a.from) || '—'} | ${clean(a.to) || '—'} | ${ev}`
}

/** Acrescenta a linha ao fim da seção ## Auditoria, sem tocar nas linhas antigas. */
export function appendAudit(text: string, line: string): string {
  const head = text.match(/^## Auditoria[ \t]*\n/m)
  if (!head || head.index === undefined) {
    const base = text.replace(/\s*$/, '')
    return `${base}\n\n## Auditoria\n\n${line}\n`
  }
  const start = head.index + head[0].length
  const rest = text.slice(start)
  const next = rest.search(/^#{1,2} /m)
  const sectionEnd = next < 0 ? text.length : start + next
  const section = text.slice(start, sectionEnd)
  const lines = section.split('\n')
  let last = -1
  lines.forEach((l, i) => {
    if (l.startsWith('- ')) last = i
  })
  if (last < 0) {
    const body = section.replace(/\s*$/, '')
    const rebuilt = `${body ? `${body}\n` : '\n'}${line}\n${next < 0 ? '' : '\n'}`
    return text.slice(0, start) + rebuilt + text.slice(sectionEnd)
  }
  lines.splice(last + 1, 0, line)
  return text.slice(0, start) + lines.join('\n') + text.slice(sectionEnd)
}
