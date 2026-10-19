import { useMemo, useState } from 'react'
import { StatusGlyph } from '@/components/status-glyph'
import { cn } from '@/lib/utils'
import { useNav } from '@/shell/nav'
import { noteId } from '@/shell/nav-ids'
import { statusesOf } from '@/vault/contracts'
import { projectSummaries } from '@/vault/derived'
import { statusLabel } from '@/vault/labels'
import { useVault } from '@/vault/vault-context'
import { queryNotes } from '@/vault/vault-index'

// Kanban de tasks: colunas na ordem do contrato; Planejada e Pronta somem quando vazias.
// Mover entre colunas chega na VO-T008.
export function KanbanView() {
  const { index } = useVault()
  const { open } = useNav()
  const [filter, setFilter] = useState<string>('all')
  const data = useMemo(() => {
    if (!index) return null
    const projects = projectSummaries(index)
    const tasks = queryNotes(index, { type: 'task' }).filter(
      (t) => filter === 'all' || t.project === filter,
    )
    const order = statusesOf(index.contracts, 'task').filter((s) => s !== 'cancelled')
    const hidden = ['planned', 'ready'].filter((s) => !tasks.some((t) => t.status === s))
    const cols = order.filter((s) => !hidden.includes(s))
    return { projects, tasks, cols, hidden }
  }, [index, filter])
  if (!data || !index) return null

  return (
    <div className="grid min-h-full grid-rows-[auto_minmax(0,1fr)]">
      <div className="flex flex-wrap items-center gap-2.5 border-b px-4 py-3.5 sm:px-6">
        <h2 className="mr-3.5 text-[13px] font-extrabold tracking-[0.1em] text-strong uppercase">
          Kanban de tasks
        </h2>
        {[
          { id: 'all', label: 'Todos os projetos' },
          ...data.projects.map((p) => ({ id: p.note.path, label: p.note.code ?? p.note.title })),
        ].map((c) => (
          <button
            key={c.id}
            className={cn(
              'border px-2.5 py-[5px] text-[12.5px] text-secondary hover:bg-elevated',
              filter === c.id && 'border-strong bg-elevated text-strong',
            )}
            onClick={() => setFilter(c.id)}
          >
            {c.label}
          </button>
        ))}
        {data.hidden.length > 0 && (
          <span className="ml-auto hidden text-[12px] text-faint md:inline">
            {data.hidden.map(statusLabel).join(' e ')} ocultas (0 tasks)
          </span>
        )}
      </div>
      <div
        className="grid items-start gap-4 overflow-x-auto px-4 pt-[18px] pb-10 sm:px-6"
        style={{ gridTemplateColumns: `repeat(${data.cols.length}, minmax(240px, 1fr))` }}
        data-testid="kanban"
      >
        {data.cols.map((s) => {
          const items = data.tasks.filter((t) => t.status === s)
          const shown = s === 'done' ? items.slice(-5).reverse() : items
          return (
            <div key={s} className="grid min-w-0 content-start gap-2" data-col={s}>
              <div
                className={cn(
                  'grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 pt-2.5 pb-2 rule-column',
                  s === 'blocked' && 'border-nasa',
                )}
              >
                <StatusGlyph status={s} size={12} />
                <b
                  className={cn(
                    'text-[12px] font-bold tracking-[0.06em] text-strong uppercase',
                    s === 'blocked' && 'text-nasa',
                  )}
                >
                  {statusLabel(s)}
                </b>
                <span className="font-mono text-[11px] text-faint">{items.length}</span>
              </div>
              {shown.map((t) => (
                <button
                  key={t.path}
                  className="grid gap-1 border bg-elevated px-3 pt-[11px] pb-2.5 text-left hover:border-faint"
                  onClick={() => open(noteId(t.path))}
                  data-testid="kanban-card"
                >
                  <span className="flex items-center gap-2">
                    <StatusGlyph status={t.status} size={10} />
                    <span className="font-mono text-[11px] text-secondary">{t.code}</span>
                  </span>
                  <span className="text-[13.5px] leading-snug text-strong">{t.title}</span>
                </button>
              ))}
              {!items.length && (
                <div className="border border-dashed px-3 py-[18px] text-center text-[12.5px] text-faint">
                  Nenhuma task
                </div>
              )}
              {s === 'done' && items.length > 5 && (
                <div className="border-t border-dashed px-0.5 py-1.5 text-[12px] text-faint">
                  mais {items.length - 5} concluídas
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
