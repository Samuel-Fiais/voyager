import { useMemo } from 'react'
import { StatusGlyph } from '@/components/status-glyph'
import { cn } from '@/lib/utils'
import { ProjectTrajectory } from '@/record/trajectory'
import { useNav } from '@/shell/nav'
import { noteId } from '@/shell/nav-ids'
import { attention, projectSummaries } from '@/vault/derived'
import { typeLabel } from '@/vault/labels'
import { useVault } from '@/vault/vault-context'
import { queryNotes } from '@/vault/vault-index'
import { useWorkspace } from '@/workspace/workspace-context'
import { NoteRow, Page, SectionHeader, ViewHeader } from './common'
import { BarList } from './custom/bars'
import { typeCounts, weeklyActivity } from './custom/query'

// Painel (W10): indicadores, trajetória dos projetos, atividade por semana, registros por tipo e demandas.
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
            weeks: weeklyActivity(index, 8),
            types: typeCounts(index),
            demands: queryNotes(index, { type: 'demand' }),
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
            data-stat={s.g}
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
        <SectionHeader
          title="Trajetória dos projetos"
          aside="uma marca por task, na ordem do código · clique abre a task"
        />
        {data.projects.map((p) => (
          <div
            key={p.note.path}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-2 border-b py-4 md:grid-cols-[200px_minmax(0,1fr)_120px]"
            data-testid="painel-project"
          >
            <button className="text-left" onClick={() => open(noteId(p.note.path))}>
              <div className="text-[24px] leading-none font-extrabold text-strong">
                {p.note.code}
              </div>
              <div className="mt-1.5 text-[13px] text-secondary">{p.note.title}</div>
            </button>
            <div className="col-span-2 row-start-2 md:col-span-1 md:row-start-auto">
              <ProjectTrajectory tasks={p.tasks} height={64} />
            </div>
            <div className="text-right">
              <span className="text-[22px] font-extrabold text-strong tabular-nums">
                {p.done}/{p.tasks.length}
              </span>
              <small className="block text-[12px] text-faint">concluídas</small>
            </div>
          </div>
        ))}
        {!data.projects.length && <p className="py-3 text-faint">Nenhum projeto no vault.</p>}
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="grid content-start gap-7">
          <div>
            <SectionHeader title="Atividade no vault" aside="linhas de auditoria por semana" />
            <BarList
              bars={data.weeks.map((w) => ({
                key: w.key,
                label: w.label,
                value: w.value,
                partial: w.partial,
              }))}
              unit="linhas de auditoria"
              testId="activity"
            />
          </div>
          <div>
            <SectionHeader
              title="Registros por tipo"
              aside={`${data.types.length} types · 6 maiores`}
            />
            <BarList
              bars={data.types.slice(0, 6).map((t) => ({
                key: t.key,
                label: `${typeLabel(t.key)} · ${t.key}`,
                value: t.value,
              }))}
              unit="registros"
              testId="types"
            />
          </div>
        </div>
        <div>
          <SectionHeader title="Demandas" aside="status · encaminhamento" />
          {data.demands.map((d) => (
            <NoteRow key={d.path} note={d} aside={String(d.data.routing ?? '')} />
          ))}
          {!data.demands.length && <p className="py-3 text-faint">Nenhuma demanda.</p>}
        </div>
      </div>
    </Page>
  )
}
