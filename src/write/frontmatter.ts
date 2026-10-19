// Edição do frontmatter linha a linha, preservando ordem, comentários e formato do arquivo.

const BARE_KEYS = new Set(['type', 'status'])

/** Formato do valor conforme o contrato de frontmatter: type/status sem aspas, o resto entre aspas. */
export function formatValue(key: string, value: string | null): string {
  if (value === null || value === '') return ''
  if (BARE_KEYS.has(key)) return value
  return JSON.stringify(value)
}

function fmBounds(text: string): { start: number; end: number } | null {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!m) return null
  return { start: 4, end: 4 + m[1].length }
}

/** Define uma propriedade escalar; cria a linha antes do fechamento se não existir. */
export function setField(text: string, key: string, value: string | null): string {
  const b = fmBounds(text)
  if (!b) throw new Error('Nota sem frontmatter.')
  const fm = text.slice(b.start, b.end)
  const lines = fm.split('\n')
  const formatted = formatValue(key, value)
  const line = formatted ? `${key}: ${formatted}` : `${key}:`
  const i = lines.findIndex((l) => l.startsWith(`${key}:`))
  if (i >= 0) {
    // remove itens de lista que pertenciam à chave (quando vira escalar)
    let j = i + 1
    while (j < lines.length && /^\s+- /.test(lines[j])) j++
    lines.splice(i, j - i, line)
  } else {
    lines.push(line)
  }
  return text.slice(0, b.start) + lines.join('\n') + text.slice(b.end)
}

/** Acrescenta um item a uma lista do frontmatter (aceita `key: []`, `key:` vazio ou lista). */
export function addListItem(text: string, key: string, item: string): string {
  const b = fmBounds(text)
  if (!b) throw new Error('Nota sem frontmatter.')
  const lines = text.slice(b.start, b.end).split('\n')
  const quoted = JSON.stringify(item)
  let i = lines.findIndex((l) => l.startsWith(`${key}:`))
  if (i < 0) {
    lines.push(`${key}:`)
    i = lines.length - 1
  }
  let j = i + 1
  while (j < lines.length && /^\s+- /.test(lines[j])) {
    if (lines[j].trim() === `- ${quoted}`) return text
    j++
  }
  lines[i] = `${key}:`
  lines.splice(j, 0, `  - ${quoted}`)
  return text.slice(0, b.start) + lines.join('\n') + text.slice(b.end)
}

export function frontmatterLines(text: string): string[] {
  const b = fmBounds(text)
  return b ? text.slice(b.start, b.end).split('\n') : []
}
