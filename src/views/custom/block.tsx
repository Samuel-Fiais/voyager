import { useVault } from '@/vault/vault-context'
import { normalizeQuery, parseBlock, type GroupBy } from './query'
import { ViewBody } from './view-render'

// Blocos embutidos nas notas (VO-DEC006): ```query, ```chart e ```kanban com um mapa YAML.
// No Obsidian aparecem como código cru, que continua legível.

const KINDS = { query: 'table', chart: 'chart', kanban: 'kanban' } as const
const GROUPS: GroupBy[] = ['status', 'type', 'client', 'project', 'week']

export function Block({ lang, code }: { lang: keyof typeof KINDS; code: string }) {
  const { index } = useVault()
  const parsed = parseBlock(code)
  if (!index) return null
  if (!parsed.ok) {
    return (
      <div className="border border-nasa bg-panel" data-testid="block-error">
        <p className="border-b px-3 py-1.5 text-[12px] text-nasa">
          Bloco {lang} inválido: {parsed.error}
        </p>
        <pre className="overflow-x-auto p-3 font-mono text-[12px] text-secondary">{code}</pre>
      </div>
    )
  }
  const v = parsed.value
  const by = GROUPS.includes(v.by as GroupBy) ? (v.by as GroupBy) : 'status'
  const columns = Array.isArray(v.columns) ? v.columns.map(String) : undefined
  return (
    <figure className="grid gap-2 border bg-bg p-3" data-testid={`block-${lang}`}>
      {typeof v.title === 'string' && <figcaption className="label-caps">{v.title}</figcaption>}
      <ViewBody
        index={index}
        kind={KINDS[lang]}
        query={normalizeQuery(v)}
        columns={columns}
        by={by}
      />
    </figure>
  )
}
