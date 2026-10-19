import { useMemo, useState } from 'react'
import { StatusGlyph } from '@/components/status-glyph'
import { cn } from '@/lib/utils'
import { attention, clientSummaries, projectSummaries } from '@/vault/derived'
import { statusLabel } from '@/vault/labels'
import { useVault } from '@/vault/vault-context'
import { listViews } from '@/views/custom/view-def'
import { ViewDialog } from '@/views/custom/view-dialog'
import { useWorkspace } from '@/workspace/workspace-context'
import { ViewIcon } from './icons'
import { MiniArc } from './mini-arc'
import { notePathOf, noteId, VIEW_LABEL, viewId, type NavId } from './nav-ids'
import { useNav } from './nav'

function Heading({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-baseline justify-between pb-2.5 text-[11px] font-bold tracking-[0.1em] text-faint uppercase">
      {title}
      {count !== undefined && (
        <small className="text-[11.5px] font-medium tracking-normal normal-case">{count}</small>
      )}
    </div>
  )
}

function NavItem({
  id,
  icon,
  children,
  extra,
}: {
  id: NavId
  icon: 'painel' | 'kanban' | 'demandas' | 'arquivos'
  children: string
  extra?: React.ReactNode
}) {
  const { current, open } = useNav()
  const on = current === id
  return (
    <button
      className={cn(
        'flex w-full items-center gap-2.5 overflow-hidden px-2.5 py-[7px] text-left whitespace-nowrap text-secondary hover:bg-elevated hover:text-strong',
        on && 'bg-elevated text-strong shadow-[inset_3px_0_0_var(--vy-strong)]',
      )}
      onClick={() => open(id)}
      aria-current={on ? 'page' : undefined}
    >
      <ViewIcon name={icon} />
      <span className="min-w-0 truncate">{children}</span>
      {extra && <span className="ml-auto shrink-0">{extra}</span>}
    </button>
  )
}

export function Sidebar() {
  const { index } = useVault()
  const { active } = useWorkspace()
  const { current, open, recent, setSidebarOpen } = useNav()
  const [allClients, setAllClients] = useState(false)
  const [newView, setNewView] = useState(false)
  const data = useMemo(() => {
    if (!index) return null
    return {
      att: attention(index),
      projects: projectSummaries(index),
      clients: clientSummaries(index),
      views: listViews(index),
    }
  }, [index])

  const withPrefix = data?.clients.filter((c) => c.prefix) ?? []
  const rest = data?.clients.filter((c) => !c.prefix) ?? []
  const shownClients = allClients ? (data?.clients ?? []) : withPrefix
  const recentNotes = recent
    .map((id) => {
      const path = notePathOf(id)
      return path && index ? index.notes.get(path) : null
    })
    .filter((n) => n != null)
    .slice(0, 5)

  return (
    <aside
      className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] gap-[22px] border-r bg-panel px-3.5 pt-[18px] pb-3"
      data-testid="sidebar"
    >
      <nav className="grid gap-0.5" aria-label="Views">
        <NavItem
          id="painel"
          icon="painel"
          extra={
            data && data.att.blocked > 0 ? (
              <span className="font-mono text-[11px] text-nasa" title="tasks bloqueadas">
                {data.att.blocked} bloq.
              </span>
            ) : null
          }
        >
          {VIEW_LABEL.painel}
        </NavItem>
        <NavItem
          id="kanban"
          icon="kanban"
          extra={
            data ? (
              <span className="ml-auto font-mono text-[11px] text-faint">
                {data.att.review} em rev.
              </span>
            ) : null
          }
        >
          {VIEW_LABEL.kanban}
        </NavItem>
        <NavItem
          id="demandas"
          icon="demandas"
          extra={
            data ? (
              <span className="font-mono text-[11px] text-faint">
                {data.att.openDemands.length} aberta{data.att.openDemands.length === 1 ? '' : 's'}
              </span>
            ) : null
          }
        >
          {VIEW_LABEL.demandas}
        </NavItem>
      </nav>

      <div className="-mx-1 grid min-h-0 content-start gap-[26px] overflow-x-hidden overflow-y-auto px-1">
        <div data-testid="sidebar-views">
          <div className="flex items-baseline justify-between pb-2.5 text-[11px] font-bold tracking-[0.1em] text-faint uppercase">
            Views salvas
            <button
              className="text-[11.5px] font-medium tracking-normal normal-case hover:text-strong"
              onClick={() => {
                setSidebarOpen(false)
                setNewView(true)
              }}
              data-testid="new-view"
            >
              + nova
            </button>
          </div>
          {data?.views.map(({ path, view }) => (
            <button
              key={path}
              className={cn(
                'flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[13px] text-secondary hover:bg-elevated hover:text-strong',
                current === viewId(path) &&
                  'bg-elevated text-strong shadow-[inset_3px_0_0_var(--vy-strong)]',
              )}
              onClick={() => open(viewId(path))}
            >
              <span className="truncate">{view.title}</span>
              <span className="ml-auto shrink-0 font-mono text-[10.5px] text-faint">
                {view.kind}
              </span>
            </button>
          ))}
          {data && !data.views.length && (
            <p className="text-[12.5px] text-faint">Views ficam em .voyager/views/.</p>
          )}
          {newView && <ViewDialog onClose={() => setNewView(false)} />}
        </div>

        <div>
          <Heading title="Projetos" count={data?.projects.length} />
          {data?.projects.map((p) => {
            const id = noteId(p.note.path)
            const note = [
              statusLabel(p.note.status),
              p.review ? `${p.review} em revisão` : '',
              p.tasks.length && p.done === p.tasks.length ? 'tasks concluídas' : '',
            ].filter(Boolean)
            return (
              <button
                key={p.note.path}
                className={cn(
                  'grid w-full gap-1 px-2.5 pt-2 pb-2.5 text-left text-strong hover:bg-elevated',
                  current === id && 'bg-elevated shadow-[inset_3px_0_0_var(--vy-strong)]',
                )}
                onClick={() => open(id)}
                data-testid="sidebar-project"
              >
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="shrink-0 font-mono text-[11px] text-secondary">
                    {p.note.code}
                  </span>
                  <span className="truncate text-[13.5px]">{p.note.title}</span>
                  <span className="ml-auto shrink-0 font-mono text-[11px] text-faint">
                    {p.done}/{p.tasks.length}
                  </span>
                </span>
                <MiniArc tasks={p.tasks} />
                <span className="flex flex-wrap items-center gap-x-2 text-[11.5px] text-faint">
                  {note.join(' · ')}
                  {p.blocked > 0 && (
                    <span className="text-nasa">
                      {p.blocked} bloqueada{p.blocked > 1 ? 's' : ''}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
          {data && !data.projects.length && (
            <p className="text-label text-faint">Nenhum projeto no vault.</p>
          )}
        </div>

        <div>
          <Heading title="Clientes" count={data?.clients.length} />
          <div className="flex flex-wrap gap-1.5">
            {shownClients.map((c) => {
              const id = noteId(c.note.path)
              return (
                <button
                  key={c.note.path}
                  className={cn(
                    'min-w-[38px] border px-2 py-[5px] text-center font-mono text-[11.5px] text-secondary hover:border-faint hover:text-strong',
                    current === id && 'border-strong bg-elevated text-strong',
                  )}
                  title={`${c.note.code} · ${c.note.title}`}
                  onClick={() => open(id)}
                >
                  {c.prefix ?? c.note.code}
                </button>
              )
            })}
            {rest.length > 0 && (
              <button
                className="min-w-[38px] border px-2 py-[5px] text-[12px] text-secondary hover:border-faint"
                onClick={() => setAllClients((v) => !v)}
                aria-expanded={allClients}
              >
                {allClients ? 'menos' : `+${rest.length}`}
              </button>
            )}
          </div>
        </div>

        <div>
          <Heading title="Recentes" />
          {recentNotes.length ? (
            recentNotes.map((n) => {
              const id = noteId(n.path)
              return (
                <button
                  key={n.path}
                  className={cn(
                    'grid w-full grid-cols-[12px_auto_minmax(0,1fr)] items-center gap-2 px-2.5 py-1.5 text-left text-[13px] text-secondary hover:bg-elevated hover:text-strong',
                    current === id && 'bg-elevated text-strong',
                  )}
                  onClick={() => open(id)}
                >
                  <StatusGlyph status={n.status} size={10} />
                  <span className="font-mono text-[11px] text-strong">{n.code ?? ''}</span>
                  <span className="truncate">{n.title}</span>
                </button>
              )
            })
          ) : (
            <p className="text-[12.5px] text-faint">O que você abrir aparece aqui.</p>
          )}
        </div>
      </div>

      <div className="grid gap-2 border-t pt-2.5">
        <NavItem id="arquivos" icon="arquivos">
          {VIEW_LABEL.arquivos}
        </NavItem>
        <div className="px-2.5 text-[11.5px] text-faint">
          Último commit lido{' '}
          <span className="font-mono text-secondary">{active?.lastCommit?.slice(0, 7) ?? '—'}</span>
        </div>
      </div>
    </aside>
  )
}
