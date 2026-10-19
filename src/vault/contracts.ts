import { backticked, basename, escapeRegExp, rawValues, splitFrontmatter } from './text'

// Regras lidas dos contratos e templates do próprio vault (R04): nada de status fixo no código.

export const ENTITY_CONTRACT = 'Skills/references/contrato-de-status-de-entidades.md'
export const TASK_CONTRACT = 'Skills/references/contrato-de-status-de-tasks.md'

export interface StatusInfo {
  status: string
  condition: string
}

export interface TypeContract {
  types: string[]
  statuses: string[]
  initial: string | null
  notes: string
}

export interface Contracts {
  /** type → status permitidos */
  allowed: Map<string, Set<string>>
  /** linhas da tabela de entidades, na ordem do contrato */
  entities: TypeContract[]
  /** status de task na ordem do contrato, com a condição documental */
  taskStatuses: StatusInfo[]
}

function cells(line: string) {
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim())
}

export function parseContracts(entityText: string, taskText: string): Contracts {
  const taskStatuses: StatusInfo[] = []
  for (const line of taskText.split('\n')) {
    const c = cells(line)
    if (
      line.startsWith('|') &&
      c.length >= 2 &&
      backticked(c[0]).length &&
      !c[0].startsWith('Status')
    ) {
      for (const s of backticked(c[0])) taskStatuses.push({ status: s, condition: c[1] })
    }
  }
  const allowed = new Map<string, Set<string>>()
  const entities: TypeContract[] = []
  for (const line of entityText.split('\n')) {
    if (!line.startsWith('| `')) continue
    const c = cells(line)
    const types = backticked(c[0])
    let statuses = backticked(c[1])
    if (c[1].includes('contrato de tasks'))
      statuses = [...new Set(taskStatuses.map((t) => t.status))].sort()
    const initial = backticked(c[2] ?? '')[0] ?? null
    entities.push({ types, statuses, initial, notes: c[3] ?? '' })
    for (const t of types) {
      const set = allowed.get(t) ?? new Set<string>()
      statuses.forEach((s) => set.add(s))
      allowed.set(t, set)
    }
  }
  return { allowed, entities, taskStatuses }
}

/** Status em ordem do contrato para um type (tasks seguem a ordem do contrato de tasks). */
export function statusesOf(contracts: Contracts, type: string): string[] {
  if (type === 'task') return contracts.taskStatuses.map((t) => t.status)
  const row = contracts.entities.find((e) => e.types.includes(type))
  return row ? row.statuses : [...(contracts.allowed.get(type) ?? [])]
}

export function initialStatusOf(contracts: Contracts, type: string): string | null {
  if (type === 'task') return contracts.taskStatuses[0]?.status ?? null
  return contracts.entities.find((e) => e.types.includes(type))?.initial ?? null
}

/** Transições permitidas pelo contrato: qualquer outro status do type. */
export function transitionsFrom(contracts: Contracts, type: string, from: string | null): string[] {
  return statusesOf(contracts, type).filter((s) => s !== from)
}

// ---------- templates ----------

export interface Template {
  path: string
  type: string
  code: string
  text: string
}

const EXTRA_CODE_PATTERNS: Record<string, string> = { diagram: '^DIA\\d{3,}$' }

// Templates das Skills: arquivos .md em Skills/<área>/<skill>/assets/ que não são exemplos.
export function parseTemplates(files: Iterable<[string, string]>): Template[] {
  const out: Template[] = []
  for (const [path, text] of files) {
    if (!path.startsWith('Skills/') || !path.endsWith('.md')) continue
    const dir = path.slice(0, path.lastIndexOf('/'))
    if (!dir.endsWith('/assets') || basename(path).startsWith('exemplo')) continue
    const { fm } = splitFrontmatter(text)
    if (!fm) continue
    const rv = rawValues(fm)
    const type = (rv.type ?? '').replace(/^"|"$/g, '')
    const code = (rv.code ?? '').replace(/^"|"$/g, '')
    if (!type || !code) continue
    out.push({ path, type, code, text })
  }
  return out
}

export function codePatterns(templates: Template[]): Map<string, RegExp[]> {
  const pats = new Map<string, RegExp[]>()
  const add = (type: string, rx: string) =>
    pats.set(type, [...(pats.get(type) ?? []), new RegExp(rx)])
  for (const t of templates) {
    let rx = ''
    let pos = 0
    for (const m of t.code.matchAll(/\{\{(\w+)\}\}/g)) {
      rx += escapeRegExp(t.code.slice(pos, m.index))
      const name = m[1]
      rx +=
        name === 'sequence'
          ? '\\d{3,}'
          : name === 'client_initials'
            ? '[A-Z][A-Z0-9]{1,4}'
            : '[A-Z0-9]+(?:-[A-Z0-9]+)*'
      pos = m.index! + m[0].length
    }
    rx += escapeRegExp(t.code.slice(pos))
    add(t.type, `^${rx}$`)
  }
  for (const [t, rx] of Object.entries(EXTRA_CODE_PATTERNS)) add(t, rx)
  return pats
}
