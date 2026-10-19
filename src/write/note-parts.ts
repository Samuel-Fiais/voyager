// Partes de uma nota para edição: frontmatter (o Voyager mantém), corpo (Samuel edita) e auditoria (append-only).

export interface NoteParts {
  head: string
  body: string
  tail: string
}

export function splitNote(text: string): NoteParts {
  const fm = text.match(/^---\n[\s\S]*?\n---\n?/)
  const head = fm ? fm[0] : ''
  const rest = text.slice(head.length)
  const audit = rest.match(/^## Auditoria[ \t]*$/m)
  if (!audit || audit.index === undefined) return { head, body: rest, tail: '' }
  return { head, body: rest.slice(0, audit.index), tail: rest.slice(audit.index) }
}

/** Remonta a nota com o corpo novo; garante uma linha em branco antes da auditoria. */
export function joinNote({ head, tail }: NoteParts, body: string): string {
  const b = body.replace(/\s*$/, '')
  if (!tail) return `${head}${b}\n`
  return `${head}${b ? `${b}\n\n` : ''}${tail}`
}
