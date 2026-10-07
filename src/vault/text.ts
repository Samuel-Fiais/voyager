// Utilitários de texto e caminho usados pelo índice e pelo validador do vault.

export const nfc = (s: string) => s.normalize('NFC')

export function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function dirname(path: string) {
  const i = path.lastIndexOf('/')
  return i < 0 ? '' : path.slice(0, i)
}

export function basename(path: string) {
  return path.slice(path.lastIndexOf('/') + 1)
}

/** Equivalente a os.path.normpath para caminhos relativos com "/". */
export function normpath(path: string) {
  const out: string[] = []
  for (const part of path.split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..') {
      if (out.length && out[out.length - 1] !== '..') out.pop()
      else out.push('..')
    } else out.push(part)
  }
  return out.join('/') || '.'
}

export function join(dir: string, path: string) {
  return dir ? `${dir}/${path}` : path
}

/** Frontmatter entre `---` no início do arquivo. */
export function splitFrontmatter(text: string): { fm: string | null; body: string; fmEnd: number } {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/)
  return m
    ? { fm: m[1], body: text.slice(m[0].length), fmEnd: m[0].length }
    : { fm: null, body: text, fmEnd: 0 }
}

/** Valores crus do frontmatter, linha a linha (como o validar-vault.py). */
export function rawValues(fm: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of fm.split('\n')) {
    const m = line.match(/^([A-Za-z_][\w-]*):[ \t]*(.*)$/)
    if (m) out[m[1]] = m[2].replace(/\s+$/, '')
  }
  return out
}

export function backticked(cell: string): string[] {
  return [...cell.matchAll(/`([^`]+)`/g)].map((m) => m[1])
}

/** Remove blocos de código cercados e código em linha. */
export function stripCode(text: string) {
  return text.replace(/^```[\s\S]*?^```/gm, '').replace(/`[^`\n]*`/g, '')
}

/** Linhas `- ` da seção `## Auditoria`, ou null se a seção não existe. */
export function auditLines(body: string): string[] | null {
  const head = body.match(/^## Auditoria[ \t]*\n/m)
  if (!head || head.index === undefined) return null
  const rest = body.slice(head.index + head[0].length)
  const next = rest.search(/^#{1,2} /m)
  const section = next < 0 ? rest : rest.slice(0, next)
  return section
    .split('\n')
    .filter((l) => l.startsWith('- '))
    .map((l) => l.replace(/\s+$/, ''))
}

export function wikilinkTargets(text: string): string[] {
  return [...stripCode(text).matchAll(/!?\[\[([^\]\n]+?)\]\]/g)].map((m) => m[1].split('|')[0])
}

export function markdownLinkTargets(text: string): string[] {
  return [...stripCode(text).matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1])
}
