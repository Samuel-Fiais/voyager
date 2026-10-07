import { initialStatusOf, type Template } from '@/vault/contracts'
import { escapeRegExp, rawValues, splitFrontmatter } from '@/vault/text'
import type { Note, VaultIndex } from '@/vault/vault-index'
import { VIA } from './audit-line'
import { setField } from './frontmatter'
import { insertLink, linkLine, wikilinkTo } from './links'
import type { WritePlan } from './plan'
import { nowISO } from './time'
import { validateChanges, type FileChange } from './validate-change'
import { appendAudit, auditLine } from './audit-line'
import { lineDiff } from './line-diff'

// Criação de notas a partir dos templates das Skills (R11): próximo código livre no vault inteiro,
// nome `<code> - <nome>.md`, pasta pela convenção do vault e vínculo de volta no registro pai (R12).

export interface CreateInput {
  index: VaultIndex
  template: Template
  name: string
  client?: Note | null
  project?: Note | null
  /** registro pai para templates cujo code usa o código de outro registro (task_code, bug_code…) */
  parent?: Note | null
  folder?: string
  actor: string
  now?: string
}

const PARENT_KEYS = [
  'task_code',
  'bug_code',
  'repository_code',
  'domain_code',
  'design_system_code',
  'architecture_code',
  'source_code',
]

/** Placeholders de código do template que exigem um registro pai. */
export function parentKeyOf(template: Template): string | null {
  return PARENT_KEYS.find((k) => template.code.includes(`{{${k}}}`)) ?? null
}

export const needsClient = (t: Template) => t.code.includes('{{client_initials}}')

/** Iniciais do cliente: alias curto em maiúsculas (ex.: VO). */
export function clientInitials(client: Note | null | undefined): string | null {
  if (!client) return null
  const aliases = Array.isArray(client.data.aliases) ? client.data.aliases.map(String) : []
  return aliases.find((a) => /^[A-Z][A-Z0-9]{1,4}$/.test(a)) ?? null
}

/** Próximo código livre no vault inteiro para o padrão do template (ex.: VO-D + 3 dígitos). */
export function nextCode(index: VaultIndex, pattern: string): string {
  const [prefix, suffix = ''] = pattern.split('{{sequence}}')
  const rx = new RegExp(`^${escapeRegExp(prefix)}(\\d{3,})${escapeRegExp(suffix)}$`)
  let max = 0
  let width = 3
  const seen = (code: string) => {
    const m = code.match(rx)
    if (m) {
      max = Math.max(max, Number(m[1]))
      width = Math.max(width, m[1].length)
    }
  }
  for (const n of index.notes.values()) if (n.code) seen(n.code)
  for (const p of index.files.keys()) seen(p.split('/').pop()!.split(' - ')[0].replace(/\.md$/, ''))
  return `${prefix}${String(max + 1).padStart(width, '0')}${suffix}`
}

const SUBFOLDER: Record<string, string> = {
  implementation_record: 'Implementação',
  review_record: 'Revisões',
  evidence: 'Evidências',
  bug_investigation: 'Investigação',
  bug_resolution: 'Resolução',
}

const dirOf = (p: string) => p.slice(0, p.lastIndexOf('/'))

/** Pasta padrão: igual à de uma nota irmã do mesmo type (mesmo projeto/cliente) ou a convenção do vault. */
export function defaultFolder(
  index: VaultIndex,
  type: string,
  { client, project, parent }: Pick<CreateInput, 'client' | 'project' | 'parent'>,
): { folder: string; ownFolder: boolean } {
  const siblings = [...index.notes.values()].filter(
    (n) =>
      n.type === type &&
      (project ? n.project === project.path : client ? n.client === client.path : true),
  )
  if (parent && SUBFOLDER[type])
    return { folder: `${dirOf(parent.path)}/${SUBFOLDER[type]}`, ownFolder: false }
  const sib = siblings[0]
  if (sib) {
    const d = dirOf(sib.path)
    const own = d.split('/').pop() === sib.name
    if (project && !own && dirOf(d) === dirOf(project.path)) return { folder: d, ownFolder: false }
    if (own) return { folder: dirOf(d), ownFolder: true }
    if (!project) return { folder: d, ownFolder: false }
  }
  const projectDir = project ? dirOf(project.path) : null
  const clientName = client?.title ?? 'Sem cliente'
  switch (type) {
    case 'demand':
      return { folder: `Demandas/${clientName}`, ownFolder: false }
    case 'company':
    case 'individual':
      return { folder: 'Clientes', ownFolder: false }
    case 'project':
      return { folder: `Projetos/${clientName}`, ownFolder: true }
    case 'task':
      return { folder: `${projectDir ?? `Projetos/${clientName}`}/Tasks`, ownFolder: true }
    case 'decision':
      return { folder: `${projectDir ?? `Projetos/${clientName}`}/Decisões`, ownFolder: false }
    case 'implementation_plan':
      return {
        folder: `${projectDir ?? `Projetos/${clientName}`}/Planos de Implementação`,
        ownFolder: false,
      }
    case 'bug':
      return { folder: `Issues/${clientName}`, ownFolder: true }
    case 'repository':
      return { folder: `Repositorios/${clientName}`, ownFolder: false }
    default:
      return { folder: projectDir ?? (client ? `Clientes` : ''), ownFolder: false }
  }
}

const LINK_KEYS: Record<string, 'client' | 'project' | 'parent'> = {
  client: 'client',
  project: 'project',
  task: 'parent',
  bug: 'parent',
  issue: 'parent',
  origin_issue: 'parent',
  repository: 'parent',
}

export function planCreate(input: CreateInput): WritePlan & { code: string; path: string } {
  const { index, template, client, project, parent, actor } = input
  const now = input.now ?? nowISO()
  const name = input.name.trim().replace(/[\\/:*?"<>|#^[\]]/g, '-')
  const errors: string[] = []
  if (!name) errors.push('Dê um nome à nota.')
  const initials = clientInitials(client)
  if (needsClient(template) && !initials)
    errors.push('Escolha um cliente com iniciais (alias curto, ex.: VO) para o código.')
  const parentKey = parentKeyOf(template)
  if (parentKey && !parent)
    errors.push(`Este template precisa de um registro pai (${parentKey.replace('_code', '')}).`)

  const codePattern = template.code
    .replace('{{client_initials}}', initials ?? 'XX')
    .replace(parentKey ? `{{${parentKey}}}` : '{{none}}', parent?.code ?? 'PAI')
  const code = nextCode(index, codePattern)
  const status = (() => {
    const fm = splitFrontmatter(template.text).fm
    const s = fm ? (rawValues(fm).status ?? '').replace(/^"|"$/g, '') : ''
    return s && !s.includes('{{') ? s : (initialStatusOf(index.contracts, template.type) ?? '')
  })()

  const values: Record<string, string> = {
    actor,
    iso8601: now,
    date: now.slice(0, 10),
    status,
    code,
    sequence: code.match(/(\d{3,})\D*$/)?.[1] ?? '',
    client_initials: initials ?? '',
    name,
    client_name: client?.title ?? '',
    project_code: project?.code ?? '',
    project_name: project?.title ?? '',
    project_path: project?.path.replace(/\.md$/, '') ?? '',
  }
  if (parent) {
    const kind = (parentKey ?? 'source_code').replace('_code', '')
    values[`${kind}_code`] = parent.code ?? ''
    values[`${kind}_name`] = parent.title
    values[`${kind}_path`] = parent.path.replace(/\.md$/, '')
  }
  let text = template.text.replace(
    /\{\{(\w+)\}\}/g,
    (m, k: string) => values[k] ?? (/_name$|^term$|^subject$/.test(k) ? name : m),
  )

  // vínculos do frontmatter com o que foi escolhido (o template traz exemplos fictícios)
  const fmKeys = new Set(Object.keys(rawValues(splitFrontmatter(text).fm ?? '')))
  for (const [key, from] of Object.entries(LINK_KEYS)) {
    if (!fmKeys.has(key)) continue
    const target =
      from === 'client'
        ? client
        : from === 'project'
          ? project
          : parent && (key !== 'repository' || parent.type === 'repository')
            ? parent
            : null
    text = setField(text, key, target ? wikilinkTo(target) : null)
  }
  // marcadores que sobraram no frontmatter viram vazio; o corpo fica como no template
  const fm = splitFrontmatter(text)
  if (fm.fm) {
    for (const line of fm.fm.split('\n')) {
      const m = line.match(/^([A-Za-z_][\w-]*):.*\{\{\w+\}\}/)
      if (m) text = setField(text, m[1], null)
    }
  }
  // auditoria de criação com a origem do Voyager
  text = text.replace(/(\| criação do registro)\s*$/m, `$1 ${VIA}`)

  const { folder: defaultDir, ownFolder } = defaultFolder(index, template.type, {
    client,
    project,
    parent,
  })
  const folder = (input.folder ?? defaultDir).replace(/\/+$/, '')
  const fileName = `${code} - ${name}`
  const path = `${folder ? `${folder}/` : ''}${ownFolder && input.folder === undefined ? `${fileName}/` : ''}${fileName}.md`
  if (index.files.has(path)) errors.push(`Já existe um arquivo em ${path}.`)

  const changes: FileChange[] = [{ path, before: null, after: text }]
  const created = { path, code, title: name, name: fileName, type: template.type }
  const backlinkTarget = parent ?? project ?? client ?? null
  const auditLines = [{ path, line: text.match(/^- `[^`]+` \| .*\| created \|.*$/m)?.[0] ?? '' }]
  if (backlinkTarget) {
    let after = insertLink(backlinkTarget.text, template.type, linkLine(created))
    after = setField(after, 'updated_by', actor)
    after = setField(after, 'updated_at', now)
    const line = auditLine({
      when: now,
      who: actor,
      action: 'updated',
      from: backlinkTarget.status ?? '—',
      to: backlinkTarget.status ?? '—',
      evidence: `vínculo para ${code} criado`,
    })
    after = appendAudit(after, line)
    changes.push({ path: backlinkTarget.path, before: backlinkTarget.text, after })
    auditLines.push({ path: backlinkTarget.path, line })
  }
  if (!errors.length) errors.push(...validateChanges(index.files, changes))
  return {
    code,
    path,
    title: `${code}: nova nota (${template.type})`,
    changes,
    diffs: changes.map((c) => ({
      path: c.before === null ? `${c.path} (novo)` : c.path,
      lines:
        c.before === null
          ? [
              `+ ${splitFrontmatter(c.after!).fm?.split('\n').length ?? 0} linhas de frontmatter e o corpo do template`,
            ]
          : lineDiff(c.before, c.after!).filter((l) => !l.includes('updated_')),
    })),
    auditLines,
    message: `${code}: criação (${template.type}) (via Voyager)`,
    errors,
    openAfter: path,
  }
}
