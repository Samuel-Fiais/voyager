import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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
  return [a * x0 + b * cx + d * x1, a * y0 + b * cy + d * y1] as [number, number]
}

/** Pontos igualmente espaçados ao longo da curva (t uniforme amontoa no vértice da parábola). */
function equalArcPoints(p: number[], count: number, samples = 320): [number, number][] {
  if (count <= 0) return []
  if (count === 1) return [bezier(0.5, p)]
  const pts: [number, number][] = []
  const cum: number[] = [0]
  for (let i = 1; i <= samples; i++) {
    const a = bezier((i - 1) / samples, p)
    const b = bezier(i / samples, p)
    cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]))
  }
  const total = cum[samples]
  for (let k = 0; k < count; k++) {
    const target = (k / (count - 1)) * total
    let i = 1
    while (i < cum.length && cum[i] < target) i++
    const t0 = (i - 1) / samples
    const t1 = i / samples
    const seg = cum[i] - cum[i - 1] || 1
    const f = t0 + ((target - cum[i - 1]) / seg) * (t1 - t0)
    pts.push(bezier(f, p))
  }
  return pts
}

function Tip({
  x,
  W,
  leftPx,
  anchorWidth,
  children,
}: {
  x?: number
  W?: number
  leftPx?: number
  anchorWidth?: number
  children: ReactNode
}) {
  const left =
    leftPx !== undefined && anchorWidth
      ? `${Math.min(Math.max(leftPx, 24), anchorWidth - 24)}px`
      : `${Math.min(Math.max(((x ?? 0) / (W ?? 1)) * 100, 18), 82)}%`
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute bottom-full z-30 mb-2 grid w-max max-w-[290px] -translate-x-1/2 gap-1.5 border border-strong bg-elevated px-3 pt-2.5 pb-3 shadow-layer"
      style={{ left }}
      data-testid="trajectory-tip"
    >
      {children}
    </div>
  )
}

function pointAnchorX(
  svg: SVGSVGElement,
  cx: number,
  cy: number,
  anchor: HTMLElement,
): number | null {
  const ctm = svg.getScreenCTM()
  if (!ctm) return null
  const p = svg.createSVGPoint()
  p.x = cx
  p.y = cy
  const screen = p.matrixTransform(ctm)
  return screen.x - anchor.getBoundingClientRect().left
}

/** A auditoria como trajetória: a distância entre pontos é o tempo real entre os registros. */
export function AuditTrajectory({ audit }: { audit: AuditEntry[] }) {
  const [hot, setHot] = useState<number | null>(null)
  if (!audit.length) return <p className="text-small text-faint">Sem linhas de auditoria.</p>
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
              <div className="flex items-center gap-2 font-mono text-meta text-secondary">
                <b className="font-medium text-strong">{formatWhen(e.when)}</b>
                <span>{e.who}</span>
              </div>
              {changed && (
                <div className="flex flex-wrap items-center gap-1.5 text-small text-secondary">
                  <StatusGlyph status={e.from} size={10} />
                  {statusLabel(e.from)} → <StatusGlyph status={e.to} size={10} />
                  {statusLabel(e.to)}
                </div>
              )}
              <div className="text-ui leading-snug text-strong">
                <span className="font-mono text-meta text-faint">{e.action}</span> {e.evidence}
              </div>
              <div className="text-small text-faint">{formatGap(gap)}</div>
            </Tip>
          )}
          <div className="-mt-0.5 flex justify-between font-mono text-meta text-faint">
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
                '-mx-1 grid grid-cols-[minmax(0,1fr)] gap-0.5 px-1 py-0.5 text-small',
                hot === i && 'bg-elevated shadow-[inset_2px_0_0_var(--vy-nasa)]',
              )}
              onMouseEnter={() => setHot(i)}
              onMouseLeave={() => setHot(null)}
            >
              <time className="font-mono text-meta text-faint" dateTime={a.when}>
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

function nearestPointIndex(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
  pts: [number, number][],
  maxDist: number,
): number | null {
  const ctm = svg.getScreenCTM()
  if (!ctm) return null
  const p = svg.createSVGPoint()
  p.x = clientX
  p.y = clientY
  const { x, y } = p.matrixTransform(ctm.inverse())
  let best = -1
  let bestD = maxDist
  for (let i = 0; i < pts.length; i++) {
    const d = Math.hypot(x - pts[i][0], y - pts[i][1])
    if (d < bestD) {
      bestD = d
      best = i
    }
  }
  return best >= 0 ? best : null
}

/** Trajetória do projeto: um ponto por task na ordem do código; clique abre a task. */
export function ProjectTrajectory({ tasks, height = 90 }: { tasks: Note[]; height?: number }) {
  const { open } = useNav()
  const [hot, setHot] = useState<number | null>(null)
  const [tipLeft, setTipLeft] = useState<number | null>(null)
  const anchorRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const n = tasks.length
  const dense = n > 28
  const compact = n > 48
  const W = dense ? Math.max(640, Math.min(3200, n * 14)) : 640
  const H = dense ? Math.max(height, compact ? 88 : 80) : height
  const P = useMemo(
    () => [10, H - 10, W / 2, dense ? -14 : -6, W - 10, H - 10],
    [H, W, dense],
  )
  const pts = useMemo(() => (n ? equalArcPoints(P, n) : []), [n, P])
  const pickRadius = compact ? 14 : dense ? 12 : 10
  const [anchorWidth, setAnchorWidth] = useState(W)

  useEffect(() => {
    const el = anchorRef.current
    if (!el) return
    const measure = () => setAnchorWidth(el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [W])

  const syncTip = useCallback(
    (index: number | null) => {
      if (index === null || !svgRef.current || !anchorRef.current) {
        setTipLeft(null)
        return
      }
      const [cx, cy] = pts[index]
      setTipLeft(pointAnchorX(svgRef.current, cx, cy, anchorRef.current))
    },
    [pts],
  )

  const onSvgPointer = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const i = nearestPointIndex(e.currentTarget, e.clientX, e.clientY, pts, pickRadius)
      setHot(i)
      syncTip(i)
    },
    [pts, pickRadius, syncTip],
  )

  useEffect(() => {
    const el = scrollRef.current
    if (!el || hot === null) return
    const onScroll = () => syncTip(hot)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [hot, syncTip])

  if (!n) return <p className="py-3 text-faint">Nenhuma task neste projeto.</p>

  let lastDone = -1
  tasks.forEach((t, i) => {
    if (t.status === 'done') lastDone = i
  })
  const d = `M ${P[0]} ${P[1]} Q ${P[2]} ${P[3]} ${P[4]} ${P[5]}`
  const showGlyphs = !compact && n <= 36
  const dotR = compact ? 1.75 : dense ? 2.5 : 3.5
  const hotTask = hot !== null ? tasks[hot] : null

  return (
    <div ref={anchorRef} className="relative" data-testid="project-trajectory">
      {hotTask && hot !== null && tipLeft !== null && (
        <Tip leftPx={tipLeft} anchorWidth={anchorWidth}>
          <div className="flex items-center gap-2 font-mono text-meta text-secondary">
            <StatusGlyph status={hotTask.status} size={10} />
            <b className="font-medium text-strong">{hotTask.code}</b>
            <span>{statusLabel(hotTask.status)}</span>
          </div>
          <div className="text-ui leading-snug text-strong">{hotTask.title}</div>
          <div className="text-small text-faint">
            PR {statusLabel(hotTask.data.pull_request_status)} · clique para abrir
          </div>
        </Tip>
      )}
      <div ref={scrollRef} className={cn(dense && 'overflow-x-auto pb-0.5')}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          width={dense ? W : '100%'}
          height={H}
          className={cn('touch-none', dense && 'max-w-none min-w-full')}
          aria-label={`Trajetória do projeto, ${n} tasks`}
          onPointerMove={onSvgPointer}
          onPointerLeave={() => {
            setHot(null)
            setTipLeft(null)
          }}
        >
          <path d={d} fill="none" stroke="var(--vy-orbit)" strokeWidth="1" strokeDasharray="2 3" />
          <path
            d={d}
            fill="none"
            stroke="var(--vy-strong)"
            strokeWidth={compact ? 2 : 1.2}
            pathLength={100}
            strokeDasharray={`${((lastDone + 1) / n) * 100} 100`}
          />
          {tasks.map((task, i) => {
            const [cx, cy] = pts[i]
            const active = hot === i
            const done = task.status === 'done'
            return (
              <g key={task.path} pointerEvents="none" data-testid="project-dot">
                {active && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={showGlyphs ? 9 : 7}
                    fill="none"
                    stroke="var(--vy-nasa)"
                    strokeWidth="1.2"
                  />
                )}
                {showGlyphs ? (
                  <g transform={`translate(${cx - 5}, ${cy - 5})`}>
                    <StatusGlyph status={task.status} size={10} />
                  </g>
                ) : (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={active ? dotR + 1.2 : dotR}
                    fill={done ? 'var(--vy-strong)' : 'var(--vy-panel)'}
                    stroke={active ? 'var(--vy-nasa)' : 'var(--vy-strong)'}
                    strokeWidth="1"
                  />
                )}
              </g>
            )
          })}
          <path
            d={d}
            fill="none"
            stroke="transparent"
            strokeWidth={compact ? 28 : 22}
            className="cursor-pointer"
            pointerEvents="stroke"
            onClick={() => {
              if (hot !== null) open(noteId(tasks[hot].path))
            }}
          />
        </svg>
      </div>
    </div>
  )
}
