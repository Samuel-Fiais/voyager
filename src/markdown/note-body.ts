/** Corpo exibido: sem a seção ## Auditoria (vai para o painel) e sem o H1 que repete o nome da nota. */
export function displayBody(body: string, noteName: string): string {
  let text = body
  const audit = text.match(/^## Auditoria[ \t]*\n/m)
  if (audit && audit.index !== undefined) {
    const rest = text.slice(audit.index + audit[0].length)
    const next = rest.search(/^#{1,2} /m)
    text = text.slice(0, audit.index) + (next < 0 ? '' : rest.slice(next))
  }
  const h1 = text.match(/^\s*# (.+)\n/)
  if (h1 && h1[1].trim() === noteName) text = text.slice(h1[0].length)
  return text.trim()
}
