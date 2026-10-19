import { StatusGlyph } from '@/components/status-glyph'
import { useNav } from '@/shell/nav'
import { noteId } from '@/shell/nav-ids'
import { statusesOf } from '@/vault/contracts'
import { statusLabel, typeLabel } from '@/vault/labels'
import type { Note, VaultIndex } from '@/vault/vault-index'
import { BarList } from './bars'
import { COLUMNS, groupCount, runQuery, type GroupBy, type ViewQuery } from './query'

function cell(index: VaultIndex, n: Note, col: string) {
  switch (col) {
    case 'code':
      return <span className="font-mono text-[12px] text-strong">{n.code}</span>
    case 'title':
      return <span className="text-strong">{n.title}</span>
    case 'status':
      return (
        <span className="inline-flex items-center gap-2 whitespace-nowrap">
          <StatusGlyph status={n.status} size={11} />
          {statusLabel(n.status)}
        </span>
      )
    case 'type':
      return typeLabel(n.type)
    case 'client':
      return n.client ? (index.notes.get(n.client)?.title ?? '—') : '—'
    case 'project':
      return n.project ? (index.notes.get(n.project)?.code ?? '—') : '—'
    case 'updated':
      return (
        <span className="font-mono text-[11.5px]">
          {String(n.data.updated_at ?? '').slice(0, 10)}
        </span>
      )
    default: {
      const v = n.data[col]
      return v == null ? '—' : String(v)
    }
  }
}

export function QueryTable({
  index,
  notes,
  columns,
}: {
  index: VaultIndex
  notes: Note[]
  columns: string[]
}) {
  const { open } = useNav()
  return (
    <div className="overflow-x-auto" data-testid="view-table">
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c}
                className="border-b-2 border-strong py-2 pr-3 text-left label-caps whitespace-nowrap"
              >
                {COLUMNS[c] ?? c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {notes.map((n) => (
            <tr
              key={n.path}
              tabIndex={0}
              className="cursor-pointer hover:bg-elevated focus-visible:bg-elevated focus-visible:outline-none"
              onClick={() => open(noteId(n.path))}
              onKeyDown={(e) => e.key === 'Enter' && open(noteId(n.path))}
            >
              {columns.map((c) => (
                <td key={c} className="border-b py-2.5 pr-3 align-top text-secondary">
                  {cell(index, n, c)}
                </td>
              ))}
            </tr>
          ))}
          {!notes.length && (
            <tr>
              <td colSpan={columns.length} className="py-3 text-faint">
                Nenhum registro.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

/** Kanban só de leitura agrupado por status (blocos e views); mover fica no kanban de tasks. */
export function QueryKanban({ index, notes }: { index: VaultIndex; notes: Note[] }) {
  const { open } = useNav()
  const type = notes[0]?.type ?? 'task'
  const order = statusesOf(index.contracts, type)
  const cols = order.filter((s) => notes.some((n) => n.status === s))
  return (
    <div
      className="grid items-start gap-3 overflow-x-auto pb-2"
      style={{ gridTemplateColumns: `repeat(${Math.max(cols.length, 1)}, minmax(180px, 1fr))` }}
      data-testid="view-kanban"
    >
      {cols.map((s) => (
        <div key={s} className="grid content-start gap-1.5">
          <div className="flex items-center gap-2 pt-2 pb-1.5 rule-column">
            <StatusGlyph status={s} size={11} />
            <b className="text-[11.5px] font-bold tracking-[0.06em] text-strong uppercase">
              {statusLabel(s)}
            </b>
            <span className="ml-auto font-mono text-[11px] text-faint">
              {notes.filter((n) => n.status === s).length}
            </span>
          </div>
          {notes
            .filter((n) => n.status === s)
            .map((n) => (
              <button
                key={n.path}
                className="grid gap-0.5 border bg-elevated px-2.5 py-2 text-left hover:border-faint"
                onClick={() => open(noteId(n.path))}
              >
                <span className="font-mono text-[11px] text-secondary">{n.code}</span>
                <span className="text-[13px] text-strong">{n.title}</span>
              </button>
            ))}
        </div>
      ))}
      {!cols.length && <p className="text-faint">Nenhum registro.</p>}
    </div>
  )
}

export function QueryChart({
  index,
  notes,
  by,
}: {
  index: VaultIndex
  notes: Note[]
  by: GroupBy
}) {
  const groups = groupCount(index, notes, by)
  const label = (k: string) =>
    by === 'status' ? statusLabel(k) : by === 'type' ? `${typeLabel(k)} · ${k}` : k
  return (
    <BarList
      bars={groups.map((g) => ({ key: g.key, label: label(g.key), value: g.value }))}
      unit="registros"
      testId="view-chart"
    />
  )
}

export function ViewBody({
  index,
  kind,
  query,
  columns,
  by,
}: {
  index: VaultIndex
  kind: 'table' | 'kanban' | 'chart'
  query: ViewQuery
  columns?: string[]
  by?: GroupBy
}) {
  const notes = runQuery(index, query)
  if (kind === 'kanban') return <QueryKanban index={index} notes={notes} />
  if (kind === 'chart') return <QueryChart index={index} notes={notes} by={by ?? 'status'} />
  return (
    <QueryTable
      index={index}
      notes={notes}
      columns={columns?.length ? columns : ['code', 'title', 'status']}
    />
  )
}
