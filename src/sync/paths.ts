// Filtros de caminho da sincronização (R03).

const IGNORED_PREFIXES = ['.obsidian/', '.trash/', '.git/']

export function isIgnored(path: string): boolean {
  return IGNORED_PREFIXES.some((p) => path === p.slice(0, -1) || path.startsWith(p))
}

const TEXT_EXTENSIONS = new Set([
  'md',
  'markdown',
  'txt',
  'json',
  'yml',
  'yaml',
  'csv',
  'tsv',
  'canvas',
  'base',
  'css',
  'js',
  'ts',
  'html',
  'xml',
  'svg',
  'py',
  'sh',
  'toml',
  'ini',
  'mmd',
  'gitignore',
  'gitattributes',
])

/** Arquivos lidos como texto (GraphQL); os demais são anexos binários. */
export function isTextPath(path: string): boolean {
  const name = path.split('/').pop() ?? path
  const dot = name.lastIndexOf('.')
  const ext = (dot >= 0 ? name.slice(dot + 1) : name).toLowerCase()
  return TEXT_EXTENSIONS.has(ext)
}
