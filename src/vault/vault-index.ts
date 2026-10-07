import { parse as parseYaml } from 'yaml'
import { parseAuditLine, type AuditEntry } from './audit'
import {
  codePatterns,
  parseContracts,
  parseTemplates,
  ENTITY_CONTRACT,
  TASK_CONTRACT,
  type Contracts,
  type Template,
} from './contracts'
import { auditLines, basename, nfc, splitFrontmatter, wikilinkTargets } from './text'
import {
  buildLinkIndex,
  isNotePath,
  resolveWikilink,
  type LinkIndex,
  type VaultFiles,
} from './validate'
import { foldText } from '@/lib/text'

// Índice local do vault (W04): notas tipadas, vínculos resolvidos, backlinks, auditoria e regras.

export interface Note {
  path: string
  /** nome do arquivo sem .md */
  name: string
  code: string | null
  type: string | null
  status: string | null
  title: string
  data: Record<string, unknown>
  hasFrontmatter: boolean
  body: string
  text: string
  links: { target: string; resolved: string | null }[]
  audit: AuditEntry[]
  /** caminho da nota do cliente (direto, pelo projeto ou a própria nota) */
  client: string | null
  /** caminho do índice do projeto */
  project: string | null
  search: string
}

export interface VaultIndex {
  notes: Map<string, Note>
  byCode: Map<string, Note>
  backlinks: Map<string, Set<string>>
  brokenLinks: { from: string; target: string }[]
  files: VaultFiles
  linkIndex: LinkIndex
  contracts: Contracts
  templates: Template[]
  codePats: Map<string, RegExp[]>
}

function wikilinkOf(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const m = value.match(/\[\[([^\]|]+)/)
  return m ? m[1] : null
}

/** Caminho resolvido sem extensão vira o arquivo .md correspondente. */
function toFilePath(files: VaultFiles, resolved: string) {
  return files.has(resolved) ? resolved : files.has(`${resolved}.md`) ? `${resolved}.md` : resolved
}

function titleOf(name: string, code: string | null) {
  if (code && name.startsWith(`${code} - `)) return name.slice(code.length + 3)
  return name
}

export function buildVaultIndex(files: VaultFiles): VaultIndex {
  const linkIndex = buildLinkIndex(files.keys())
  const texts = [...files].filter((e): e is [string, string] => e[1] !== null)
  const contracts = parseContracts(files.get(ENTITY_CONTRACT) ?? '', files.get(TASK_CONTRACT) ?? '')
  const templates = parseTemplates(texts)
  const notes = new Map<string, Note>()
  const byCode = new Map<string, Note>()
  const backlinks = new Map<string, Set<string>>()
  const brokenLinks: { from: string; target: string }[] = []

  for (const [rawPath, text] of texts) {
    const path = nfc(rawPath)
    if (!isNotePath(path)) continue
    const { fm, body } = splitFrontmatter(text)
    let data: Record<string, unknown> = {}
    if (fm !== null) {
      try {
        const parsed: unknown = parseYaml(fm, { version: '1.1' })
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
          data = parsed as Record<string, unknown>
      } catch {
        data = {}
      }
    }
    const name = basename(path).replace(/\.md$/, '')
    const code = data.code != null && data.code !== '' ? String(data.code) : null
    const links = wikilinkTargets(text).map((target) => {
      const r = resolveWikilink(target, path, linkIndex)
      return { target, resolved: r === 'self' ? path : r === null ? null : toFilePath(files, r) }
    })
    for (const l of links) {
      if (l.resolved === null) brokenLinks.push({ from: path, target: l.target })
      else if (l.resolved !== path) {
        const set = backlinks.get(l.resolved) ?? new Set<string>()
        set.add(path)
        backlinks.set(l.resolved, set)
      }
    }
    const resolveProp = (v: unknown) => {
      const t = wikilinkOf(v)
      if (!t) return null
      const r = resolveWikilink(t, path, linkIndex)
      return r && r !== 'self' ? toFilePath(files, r) : null
    }
    const note: Note = {
      path,
      name,
      code,
      type: data.type != null ? String(data.type) : null,
      status: data.status != null ? String(data.status) : null,
      title: titleOf(name, code),
      data,
      hasFrontmatter: fm !== null,
      body,
      text,
      links,
      audit: (auditLines(body) ?? [])
        .map(parseAuditLine)
        .filter((a): a is AuditEntry => a !== null),
      client: resolveProp(data.client),
      project: resolveProp(data.project),
      search: foldText(`${code ?? ''} ${name}`),
    }
    notes.set(path, note)
    if (code && !byCode.has(code)) byCode.set(code, note)
  }

  // Cliente herdado do projeto; clientes apontam para si mesmos.
  for (const note of notes.values()) {
    if (note.type === 'company' || note.type === 'individual') note.client = note.path
    else if (!note.client && note.project) note.client = notes.get(note.project)?.client ?? null
  }

  return {
    notes,
    byCode,
    backlinks,
    brokenLinks,
    files,
    linkIndex,
    contracts,
    templates,
    codePats: codePatterns(templates),
  }
}

export interface NoteQuery {
  type?: string | string[]
  status?: string | string[]
  client?: string
  project?: string
  text?: string
}

const asList = (v?: string | string[]) => (v === undefined ? null : Array.isArray(v) ? v : [v])

export function queryNotes(index: VaultIndex, q: NoteQuery): Note[] {
  const types = asList(q.type)
  const statuses = asList(q.status)
  const text = q.text ? foldText(q.text) : null
  return [...index.notes.values()]
    .filter(
      (n) =>
        (!types || (n.type !== null && types.includes(n.type))) &&
        (!statuses || (n.status !== null && statuses.includes(n.status))) &&
        (!q.client || n.client === q.client) &&
        (!q.project || n.project === q.project || n.path === q.project) &&
        (!text || n.search.includes(text)),
    )
    .sort(byCode)
}

export function byCode(a: Note, b: Note) {
  return (a.code ?? a.name).localeCompare(b.code ?? b.name, 'pt-BR', { numeric: true })
}

/** Contagem por type e status. */
export function countByTypeAndStatus(index: VaultIndex) {
  const out = new Map<string, Map<string, number>>()
  for (const n of index.notes.values()) {
    if (!n.hasFrontmatter) continue
    const t = n.type ?? 'None'
    const s = n.status ?? 'None'
    const m = out.get(t) ?? new Map<string, number>()
    m.set(s, (m.get(s) ?? 0) + 1)
    out.set(t, m)
  }
  return out
}

export function noteByWikilink(index: VaultIndex, target: string, from: string): Note | null {
  const r = resolveWikilink(target, from, index.linkIndex)
  if (!r) return null
  return index.notes.get(r === 'self' ? from : toFilePath(index.files, r)) ?? null
}

/** Templates das Skills para um type; quando há mais de um, o primeiro é o de criação direta. */
export function templatesFor(index: VaultIndex, type: string): Template[] {
  return index.templates
    .filter((t) => t.type === type)
    .sort((a, b) => templateRank(a) - templateRank(b) || a.path.localeCompare(b.path))
}

function templateRank(t: Template) {
  // Correções de bug e índices são variantes; o template principal da Skill vem primeiro.
  if (/criar-correcao-de-bug|template-indice/.test(t.path)) return 1
  return 0
}
