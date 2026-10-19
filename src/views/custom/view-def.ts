import type { VaultIndex } from '@/vault/vault-index'
import { auditLine } from '@/write/audit-line'
import type { WritePlan } from '@/write/plan'
import { nowISO } from '@/write/time'
import type { FileChange } from '@/write/validate-change'
import { lineDiff } from '@/write/line-diff'
import type { GroupBy, ViewQuery } from './query'

// Views versionadas no repositório do vault (VO-DEC006): `.voyager/views/<id>.json`, com auditoria no próprio JSON.

export const VIEWS_DIR = '.voyager/views'

export type ViewKind = 'table' | 'kanban' | 'chart'

export interface ViewDefinition {
  version: 1
  id: string
  title: string
  kind: ViewKind
  query: ViewQuery
  /** colunas da tabela */
  columns?: string[]
  /** agrupamento do kanban e do gráfico */
  by?: GroupBy
  created_by: string
  created_at: string
  updated_by: string
  updated_at: string
  /** linhas no formato do contrato de auditoria, append-only */
  audit: string[]
}

export const viewPath = (id: string) => `${VIEWS_DIR}/${id}.json`

export function slugify(title: string) {
  return (
    title
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'view'
  )
}

export function parseView(text: string): ViewDefinition | null {
  try {
    const v = JSON.parse(text) as ViewDefinition
    if (v && v.version === 1 && typeof v.id === 'string' && typeof v.title === 'string' && v.query)
      return v
    return null
  } catch {
    return null
  }
}

export const serializeView = (v: ViewDefinition) => `${JSON.stringify(v, null, 2)}\n`

export function listViews(index: VaultIndex): { path: string; view: ViewDefinition }[] {
  const out: { path: string; view: ViewDefinition }[] = []
  for (const [path, text] of index.files) {
    if (!path.startsWith(`${VIEWS_DIR}/`) || !path.endsWith('.json') || text === null) continue
    const view = parseView(text)
    if (view) out.push({ path, view })
  }
  return out.sort((a, b) => a.view.title.localeCompare(b.view.title, 'pt-BR'))
}

export interface ViewInput {
  title: string
  kind: ViewKind
  query: ViewQuery
  columns?: string[]
  by?: GroupBy
}

function validate(index: VaultIndex, input: ViewInput): string[] {
  const errors: string[] = []
  if (!input.title.trim()) errors.push('Dê um título à view.')
  if (input.query.client && !index.byCode.get(input.query.client))
    errors.push(`Cliente ${input.query.client} não existe no vault.`)
  if (input.query.project && !index.byCode.get(input.query.project))
    errors.push(`Projeto ${input.query.project} não existe no vault.`)
  return errors
}

export function planCreateView(
  index: VaultIndex,
  input: ViewInput,
  actor: string,
  now = nowISO(),
): WritePlan & { path: string } {
  let id = slugify(input.title)
  let n = 2
  while (index.files.has(viewPath(id))) id = `${slugify(input.title)}-${n++}`
  const line = auditLine({
    when: now,
    who: actor,
    action: 'created',
    from: '—',
    to: input.kind,
    evidence: `view ${input.title}`,
  })
  const view: ViewDefinition = {
    version: 1,
    id,
    title: input.title.trim(),
    kind: input.kind,
    query: input.query,
    ...(input.columns?.length ? { columns: input.columns } : {}),
    ...(input.by ? { by: input.by } : {}),
    created_by: actor,
    created_at: now,
    updated_by: actor,
    updated_at: now,
    audit: [line],
  }
  const text = serializeView(view)
  const path = viewPath(id)
  const changes: FileChange[] = [{ path, before: null, after: text }]
  return {
    path,
    title: `View ${view.title}`,
    changes,
    diffs: [
      {
        path: `${path} (nova)`,
        lines: text
          .trimEnd()
          .split('\n')
          .map((l) => `+ ${l}`),
      },
    ],
    auditLines: [{ path, line }],
    message: `.voyager/views: nova view "${view.title}" (via Voyager)`,
    errors: validate(index, input),
  }
}

export function planUpdateView(
  index: VaultIndex,
  path: string,
  input: ViewInput,
  actor: string,
  now = nowISO(),
): WritePlan {
  const before = index.files.get(path) ?? null
  const current = before ? parseView(before) : null
  if (!before || !current) {
    return {
      title: 'View',
      changes: [],
      diffs: [],
      auditLines: [],
      message: '',
      errors: [`View não encontrada: ${path}`],
    }
  }
  const line = auditLine({
    when: now,
    who: actor,
    action: 'updated',
    from: current.kind,
    to: input.kind,
    evidence: `view ${input.title}`,
  })
  const next: ViewDefinition = {
    ...current,
    title: input.title.trim(),
    kind: input.kind,
    query: input.query,
    columns: input.columns?.length ? input.columns : undefined,
    by: input.by,
    updated_by: actor,
    updated_at: now,
    audit: [...current.audit, line],
  }
  const after = serializeView(next)
  return {
    title: `View ${next.title}`,
    changes: [{ path, before, after }],
    diffs: [{ path, lines: lineDiff(before, after) }],
    auditLines: [{ path, line }],
    message: `.voyager/views: view "${next.title}" atualizada (via Voyager)`,
    errors: before === after ? ['Nada mudou na view.'] : validate(index, input),
  }
}
