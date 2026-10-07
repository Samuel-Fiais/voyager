import { useMemo } from 'react'
import { StatusGlyph } from '@/components/status-glyph'
import { cn } from '@/lib/utils'
import { MiniArc } from '@/shell/mini-arc'
import { useNav } from '@/shell/nav'
import { noteId } from '@/shell/nav-ids'
import { attention, clientSummaries, projectSummaries } from '@/vault/derived'
import { useVault } from '@/vault/vault-context'
import { useWorkspace } from '@/workspace/workspace-context'
import { NoteRow, Page, SectionHeader, ViewHeader } from './common'

export function PainelView() {
  const { index } = useVault()
  const { active } = useWorkspace()
  const { open } = useNav()
  const data = useMemo(
    () =>
      index
        ? {
            att: attention(index),
            projects: projectSummaries(index),
            clients: clientSummaries(index),
          }
        : null,
    [index],
  )
  if (!data || !index) return null
  const { att } = data
  const stats = [
    { v: att.review, l: 'Em revisão', g: 'in_review', s: 'aguardando parecer' },
    {
      v: att.changes,
      l: 'Ajustes pedidos',
      g: 'changes_requested',
      s: 'voltaram ao desenvolvedor',
    },
    { v: att.blocked, l: 'Bloqueadas', g: 'blocked', s: 'com impedimento registrado', alert: true },
    { v: att.done, l: 'Concluídas', g: 'done', s: 'com revisão aprovada' },
    {
      v: att.openDemands.length,
      l: 'Demandas abertas',
      g: 'needs_clarification',
      s: att.openDemands.map((d) => d.code).join(', ') || 'nenhuma',
    },
  ]
  const today = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
  return (
    <Page>
      <ViewHeader meta={['Painel', today, `${active?.repo} · ${active?.branch}`]} title="Painel" />
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-5" data-testid="stats">
        {stats.map((s) => (
          <div
            key={s.l}
            className={cn('grid gap-0.5 pt-2.5 rule-column', s.alert && s.v && 'border-nasa')}
          >
            <span
              className={cn(
                'text-[40px] leading-none font-extrabold text-strong tabular-nums',
                s.alert && s.v && 'text-nasa',
              )}
            >
              {s.v}
            </span>
            <span className="flex items-center gap-2 text-[12px] font-bold tracking-[0.06em] text-secondary uppercase">
              <StatusGlyph status={s.g} size={11} />
              {s.l}
            </span>
            <small className="truncate text-[12px] text-faint">{s.s}</small>
          </div>
        ))}
      </div>
      <div>
        <SectionHeader title="Projetos" aside="uma marca por task, na ordem do código" />
        {data.projects.map((p) => (
          <button
            key={p.note.path}
            className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-2 border-b py-4 text-left hover:bg-elevated md:grid-cols-[200px_minmax(0,1fr)_120px]"
            onClick={() => open(noteId(p.note.path))}
          >
            <div>
              <div className="text-[24px] leading-none font-extrabold text-strong">
                {p.note.code}
              </div>
              <div className="mt-1.5 text-[13px] text-secondary">{p.note.title}</div>
            </div>
            <div className="col-span-2 row-start-2 md:col-span-1 md:row-start-auto">
              <MiniArc tasks={p.tasks} />
            </div>
            <div className="text-right">
              <span className="text-[22px] font-extrabold text-strong tabular-nums">
                {p.done}/{p.tasks.length}
              </span>
              <small className="block text-[12px] text-faint">concluídas</small>
            </div>
          </button>
        ))}
      </div>
      <div>
        <SectionHeader title="Demandas abertas" aside={att.openDemands.length} />
        {att.openDemands.map((d) => (
          <NoteRow key={d.path} note={d} aside={String(d.data.routing ?? '')} />
        ))}
        {!att.openDemands.length && <p className="py-3 text-faint">Nenhuma demanda aberta.</p>}
      </div>
    </Page>
  )
}
