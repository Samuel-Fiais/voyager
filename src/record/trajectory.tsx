import { useState, type ReactNode } from 'react'
import { StatusGlyph } from '@/components/status-glyph'
import { cn } from '@/lib/utils'
import { useNav } from '@/shell/nav'
import { noteId } from '@/shell/nav-ids'
import { timeOf, type AuditEntry } from '@/vault/audit'
import { statusLabel } from '@/vault/labels'
import type { Note } from '@/vault/vault-index'
import { formatGap, formatShort, formatSpan, formatWhen } from './time'

function bezier(f: number, p: number[]) {
  const [x0, y0, cx, cy, x1, y1] = p
  const a = (1 - f) * (1 - f)
  const b = 2 * (1 - f) * f
  const d = f * f
  return [a * x0 + b * cx + d * x1, a * y0 + b * cy + d * y1]
}

function Tip({ x, W, children }: { x: number; W: number; children: ReactNode }) {
  const left = Math.min(Math.max((x / W) * 100, 18), 82)
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute bottom-full z-30 mb-2 grid w-max max-w-[290px] -translate-x-1/2 gap-1.5 border border-strong bg-elevated px-3 pt-2.5 pb-3 shadow-layer"
      style={{ left: `${left}%` }}
      data-testid="trajectory-tip"
    >
      {children}
    </div>
  )
}

/** A auditoria como trajetória: a distância entre pontos é o tempo real entre os registros. */
export function AuditTrajectory({ audit }: { audit: AuditEntry[] }) {
  const [hot, setHot] = useState<number | null>(null)
  if (!audit.length) return <p className="text-[12.5px] text-faint">Sem linhas de auditoria.</p>
  const W = 274
  const H = 74
  const P = [8, 66, 137, -10, 266, 66]
  const times = audit.map(timeOf)
  const t0 = times[0]
  const span = Math.max(times[times.length - 1] - t0, 0)
  const pts = audit.map((_, i) => {
    const f =
      span > 0
        ? 0.04 + (0.88 * (times[i] - t0)) / span
        : 0.04 + (0.88 * i) / Math.max(audit.length - 1, 1)
    return bezier(f, P)
  })
  const d = `M ${P[0]} ${P[1]} Q ${P[2]} ${P[3]} ${P[4]} ${P[5]}`
  const e = hot !== null ? audit[hot] : null
  const gap = hot !== null && hot > 0 ? times[hot] - times[hot - 1] : null
  const changed = e && e.from !== e.to && e.from !== '—' && e.to !== '—'

  return (
    <div data-testid="audit-trajectory">
      {audit.length >= 2 && (
        <div className="relative">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            height={H}
            role="img"
            aria-label={`Trajetória da auditoria, ${audit.length} registros`}
          >
            <path
              d={d}
              fill="none"
              stroke="var(--vy-orbit)"
              strokeWidth="1"
              strokeDasharray="2 3"
            />
            <path
              d={d}
              fill="none"
              stroke="var(--vy-strong)"
              strokeWidth="1"
              pathLength={100}
              strokeDasharray="92 100"
            />
            {pts.map(([cx, cy], i) => {
              const last = i === pts.length - 1
              return (
                <g
                  key={i}
                  tabIndex={0}
                  className="cursor-pointer outline-none"
                  onMouseEnter={() => setHot(i)}
                  onMouseLeave={() => setHot(null)}
                  onFocus={() => setHot(i)}
                  onBlur={() => setHot(null)}
                  aria-label={`${formatWhen(audit[i].when)} ${audit[i].who} ${audit[i].action}`}
                  data-testid="audit-dot"
                >
                  <circle cx={cx} cy={cy} r={10} fill="transparent" />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={7.5}
                    fill="none"
                    stroke="var(--vy-nasa)"
                    strokeWidth="1"
                    opacity={hot === i ? 1 : 0}
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={last ? 4.2 : 3}
                    fill={last ? 'var(--vy-strong)' : 'var(--vy-panel)'}
                    stroke={hot === i ? 'var(--vy-nasa)' : 'var(--vy-strong)'}
                    strokeWidth="1.3"
                  />
                </g>
              )
            })}
          </svg>
          {e && hot !== null && (
            <Tip x={pts[hot][0]} W={W}>
              <div className="flex items-center gap-2 font-mono text-[11px] text-secondary">
                <b className="font-medium text-strong">{formatWhen(e.when)}</b>
                <span>{e.who}</span>
              </div>
              {changed && (
                <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-secondary">
                  <StatusGlyph status={e.from} size={10} />
                  {statusLabel(e.from)} → <StatusGlyph status={e.to} size={10} />
                  {statusLabel(e.to)}
                </div>
              )}
              <div className="text-[13.5px] leading-snug text-strong">
                <span className="font-mono text-[11px] text-faint">{e.action}</span> {e.evidence}
              </div>
              <div className="text-[11.5px] text-faint">{formatGap(gap)}</div>
            </Tip>
          )}
          <div className="-mt-0.5 flex justify-between font-mono text-[10px] text-faint">
            <span>{formatShort(audit[0].when)}</span>
            <span>{formatSpan(span)} de trajetória</span>
            <span>{formatShort(audit[audit.length - 1].when)}</span>
          </div>
        </div>
      )}
      <ol className="mt-2.5 grid gap-2.5" reversed data-testid="audit-list">
        {audit
          .map((a, i) => ({ a, i }))
          .reverse()
          .map(({ a, i }) => (
            <li
              key={i}
              className={cn(
                '-mx-1 grid grid-cols-[minmax(0,1fr)] gap-0.5 px-1 py-0.5 text-[12.5px]',
                hot === i && 'bg-elevated shadow-[inset_2px_0_0_var(--vy-nasa)]',
              )}
              onMouseEnter={() => setHot(i)}
              onMouseLeave={() => setHot(null)}
            >
              <time className="font-mono text-[10.5px] text-faint" dateTime={a.when}>
                {formatWhen(a.when)}
              </time>
              <span className="text-secondary">
                <b className="font-semibold text-strong">{a.who}</b> {a.action}
                {a.from !== a.to && a.to !== '—' ? ` ${a.from} → ${a.to}` : ''} · {a.evidence}
              </span>
            </li>
          ))}
      </ol>
    </div>
  )
}

/** Trajetória do projeto: um ponto por task na ordem do código; clique abre a task. */
export function ProjectTrajectory({ tasks, height = 90 }: { tasks: Note[]; height?: number }) {
  const { open } = useNav()
  const [hot, setHot] = useState<number | null>(null)
  if (!tasks.length) return <p className="py-3 text-faint">Nenhuma task neste projeto.</p>
  const W = 640
  const H = height
  const P = [10, H - 8, 320, -6, 630, H - 8]
  const n = tasks.length
  let lastDone = -1
  tasks.forEach((t, i) => {
    if (t.status === 'done') lastDone = i
  })
  const d = `M ${P[0]} ${P[1]} Q ${P[2]} ${P[3]} ${P[4]} ${P[5]}`
  const pts = tasks.map((_, i) => bezier((i + 0.5) / n, P))
  const t = hot !== null ? tasks[hot] : null
  return (
    <div className="relative" data-testid="project-trajectory">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} aria-label="Trajetória do projeto">
        <path d={d} fill="none" stroke="var(--vy-orbit)" strokeWidth="1" strokeDasharray="2 3" />
        <path
          d={d}
          fill="none"
          stroke="var(--vy-strong)"
          strokeWidth="1.2"
          pathLength={100}
          strokeDasharray={`${((lastDone + 1) / n) * 100} 100`}
        />
        {tasks.map((task, i) => {
          const [cx, cy] = pts[i]
          const hw = Math.max(5, (W - 20) / n / 2)
          return (
            <g
              key={task.path}
              tabIndex={0}
              role="link"
              className="cursor-pointer outline-none"
              aria-label={`${task.code} ${statusLabel(task.status)} ${task.title}`}
              onMouseEnter={() => setHot(i)}
              onMouseLeave={() => setHot(null)}
              onFocus={() => setHot(i)}
              onBlur={() => setHot(null)}
              onClick={() => open(noteId(task.path))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  open(noteId(task.path))
                }
              }}
              data-testid="project-dot"
            >
              <rect x={cx - hw} y={cy - 14} width={hw * 2} height={28} fill="transparent" />
              <circle
                cx={cx}
                cy={cy}
                r={8}
                fill="none"
                stroke="var(--vy-nasa)"
                strokeWidth="1.2"
                opacity={hot === i ? 1 : 0}
              />
              <svg x={cx - 5} y={cy - 5} width={10} height={10}>
                <StatusGlyph status={task.status} size={10} />
              </svg>
            </g>
          )
        })}
      </svg>
      {t && hot !== null && (
        <Tip x={pts[hot][0]} W={W}>
          <div className="flex items-center gap-2 font-mono text-[11px] text-secondary">
            <StatusGlyph status={t.status} size={10} />
            <b className="font-medium text-strong">{t.code}</b>
            <span>{statusLabel(t.status)}</span>
          </div>
          <div className="text-[13.5px] leading-snug text-strong">{t.title}</div>
          <div className="text-[11.5px] text-faint">
            PR {String(t.data.pull_request_status ?? '—')} · clique para abrir
          </div>
        </Tip>
      )}
    </div>
  )
}
