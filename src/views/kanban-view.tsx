import {
  closestCenter,
  DndContext,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type CollisionDetection,
  type KeyboardCoordinateGetter,
} from '@dnd-kit/core'
import { useMemo, useState } from 'react'
import { StatusGlyph } from '@/components/status-glyph'
import { cn } from '@/lib/utils'
import { StatusMenu } from '@/record/status-menu'
import { useNav } from '@/shell/nav'
import { noteId } from '@/shell/nav-ids'
import { statusesOf, transitionsFrom } from '@/vault/contracts'
import { projectSummaries } from '@/vault/derived'
import { statusLabel } from '@/vault/labels'
import { useVault } from '@/vault/vault-context'
import { queryNotes, type Note } from '@/vault/vault-index'
import { useStartStatusChange } from '@/write/start-status'
import { useMedia } from '@/lib/use-media'
import { MOBILE } from '@/shell/mobile'

// Kanban de tasks (W08): colunas na ordem do contrato, Planejada e Pronta somem quando vazias.
// Arrastar só acende as colunas válidas; soltar fora delas não faz nada. ⋯ e teclado como alternativa.

/** Teclado: setas esquerda/direita levam o card à coluna vizinha. */
const columnKeys: KeyboardCoordinateGetter = (event, { context }) => {
  const { collisionRect, droppableRects } = context
  if (!collisionRect || (event.code !== 'ArrowRight' && event.code !== 'ArrowLeft'))
    return undefined
  event.preventDefault()
  const rects = [...droppableRects.values()].sort((a, b) => a.left - b.left)
  const center = collisionRect.left + collisionRect.width / 2
  let i = rects.findIndex((r) => center >= r.left && center <= r.left + r.width)
  if (i < 0) i = 0
  const target =
    rects[event.code === 'ArrowRight' ? Math.min(i + 1, rects.length - 1) : Math.max(i - 1, 0)]
  return { x: target.left + target.width / 2 - collisionRect.width / 2, y: target.top + 40 }
}

/** Ponteiro dentro da coluna; no teclado (sem ponteiro), a coluna de centro mais próximo. */
const collision: CollisionDetection = (args) => {
  if (args.pointerCoordinates) return pointerWithin(args)
  return closestCenter(args)
}

/** Cliques e teclas no ⋯ e no menu de status não abrem nem arrastam o card. */
function fromMenu(target: EventTarget) {
  return target instanceof Element && !!target.closest('[data-card-menu]')
}

function Card({ task, projectCode }: { task: Note; projectCode: string }) {
  const { open } = useNav()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.path,
    data: { status: task.status },
  })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      role="button"
      aria-roledescription="card arrastável"
      aria-label={`${task.code} ${task.title}. Espaço para pegar e mover com as setas; Enter abre.`}
      style={
        transform
          ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 20 }
          : undefined
      }
      className={cn(
        'group relative grid cursor-grab touch-none gap-1 border bg-elevated px-3 pt-[11px] pb-2.5 text-left outline-none hover:border-faint focus-visible:border-strong',
        isDragging && 'opacity-60 shadow-layer',
      )}
      onClick={(e) => {
        if (fromMenu(e.target)) return
        open(noteId(task.path))
      }}
      onKeyDown={(e) => {
        if (fromMenu(e.target)) return
        listeners?.onKeyDown?.(e)
        if (e.key === 'Enter' && !e.defaultPrevented) open(noteId(task.path))
      }}
      data-testid="kanban-card"
      data-code={task.code}
    >
      <span className="flex items-center gap-2">
        <StatusGlyph status={task.status} size={10} />
        <span className="font-mono text-[11px] text-secondary">{task.code}</span>
        <span
          className="ml-auto opacity-100 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
          data-card-menu
        >
          <StatusMenu note={task} variant="more" />
        </span>
      </span>
      <span className="text-[13.5px] leading-snug text-strong">{task.title}</span>
      <span className="hidden gap-2.5 text-[11.5px] text-faint group-focus-within:flex group-hover:flex">
        <span>{projectCode}</span>
        <span>PR {String(task.data.pull_request_status ?? '—')}</span>
      </span>
    </div>
  )
}

function Column({
  status,
  items,
  total,
  validity,
  projects,
}: {
  status: string
  items: Note[]
  total: number
  validity: 'valid' | 'invalid' | 'self' | null
  projects: Map<string, string>
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'grid min-h-[200px] min-w-0 content-start gap-2 pb-3 transition-opacity motion-reduce:transition-none',
        validity === 'invalid' && 'opacity-30',
        validity === 'valid' && 'outline-1 outline-offset-[6px] outline-nasa outline-dashed',
        validity === 'valid' && isOver && 'bg-elevated',
      )}
      data-col={status}
      data-valid={validity ?? undefined}
      data-over={isOver || undefined}
    >
      <div
        className={cn(
          'grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 pt-2.5 pb-2 rule-column',
          (status === 'blocked' || validity === 'valid') && 'border-nasa',
        )}
      >
        <StatusGlyph status={status} size={12} />
        <b
          className={cn(
            'text-[12px] font-bold tracking-[0.06em] text-strong uppercase',
            status === 'blocked' && 'text-nasa',
          )}
        >
          {statusLabel(status)}
        </b>
        <span className="font-mono text-[11px] text-faint">{total}</span>
      </div>
      {items.map((t) => (
        <Card key={t.path} task={t} projectCode={projects.get(t.project ?? '') ?? ''} />
      ))}
      {!total && (
        <div className="border border-dashed px-3 py-[18px] text-center text-[12.5px] text-faint">
          {status === 'in_progress' ? 'Nada em andamento agora.' : 'Nenhuma task'}
        </div>
      )}
      {status === 'done' && total > items.length && (
        <div className="border-t border-dashed px-0.5 py-1.5 text-[12px] text-faint">
          mais {total - items.length} concluídas
        </div>
      )}
    </div>
  )
}

export function KanbanView() {
  const { index } = useVault()
  const startChange = useStartStatusChange()
  const [filter, setFilter] = useState<string>('all')
  const [dragging, setDragging] = useState<Note | null>(null)
  const mobile = useMedia(MOBILE)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: columnKeys,
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] },
    }),
  )
  const data = useMemo(() => {
    if (!index) return null
    const projects = projectSummaries(index)
    const tasks = queryNotes(index, { type: 'task' }).filter(
      (t) => filter === 'all' || t.project === filter,
    )
    const order = statusesOf(index.contracts, 'task').filter((s) => s !== 'cancelled')
    const hidden = ['planned', 'ready'].filter((s) => !tasks.some((t) => t.status === s))
    const cols = order.filter((s) => !hidden.includes(s))
    return {
      projects,
      tasks,
      cols,
      hidden,
      codes: new Map(projects.map((p) => [p.note.path, p.note.code ?? ''])),
    }
  }, [index, filter])
  if (!data || !index) return null
  const allowed = dragging ? transitionsFrom(index.contracts, 'task', dragging.status) : []
  const validity = (s: string) =>
    !dragging ? null : s === dragging.status ? 'self' : allowed.includes(s) ? 'valid' : 'invalid'

  const onDragStart = (e: DragStartEvent) =>
    setDragging(index.notes.get(String(e.active.id)) ?? null)
  const onDragEnd = (e: DragEndEvent) => {
    const task = dragging
    setDragging(null)
    const to = e.over ? String(e.over.id) : null
    if (!task || !to || to === task.status) return
    if (!transitionsFrom(index.contracts, 'task', task.status).includes(to)) return
    startChange(task.path, to)
  }

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
            aria-pressed={filter === c.id}
          >
            {c.label}
          </button>
        ))}
        <span className="ml-auto hidden text-[12px] text-faint md:inline">
          {data.hidden.length
            ? `${data.hidden.map(statusLabel).join(' e ')} ocultas (0 tasks) · `
            : ''}
          arraste, use ⋯ ou o teclado
        </span>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={collision}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragging(null)}
      >
        <div
          className="grid items-start gap-4 overflow-x-auto px-4 pt-[18px] pb-10 sm:px-6"
          data-hscroll
          style={{
            gridTemplateColumns: mobile
              ? `repeat(${data.cols.length}, 264px)`
              : `repeat(${data.cols.length}, minmax(150px, 1fr))`,
          }}
          data-testid="kanban"
        >
          {data.cols.map((s) => {
            const items = data.tasks.filter((t) => t.status === s)
            return (
              <Column
                key={s}
                status={s}
                items={s === 'done' ? items.slice(-5).reverse() : items}
                total={items.length}
                validity={validity(s)}
                projects={data.codes}
              />
            )
          })}
        </div>
      </DndContext>
    </div>
  )
}
