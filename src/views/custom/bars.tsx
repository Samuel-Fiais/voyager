import { useState } from 'react'
import { cn } from '@/lib/utils'

export interface Bar {
  key: string
  label: string
  value: number
  partial?: boolean
  onClick?: () => void
}

/**
 * Barras horizontais de uma série (magnitude): um tom só (texto principal), sem legenda,
 * valor sempre escrito ao lado e dica ao passar o mouse ou focar (VO-DS001, skill dataviz).
 */
export function BarList({ bars, unit, testId }: { bars: Bar[]; unit: string; testId?: string }) {
  const [hot, setHot] = useState<string | null>(null)
  const max = Math.max(1, ...bars.map((b) => b.value))
  const total = bars.reduce((a, b) => a + b.value, 0)
  if (!bars.length) return <p className="py-3 text-[12.5px] text-faint">Sem dados.</p>
  return (
    <div className="grid gap-2.5 pt-2.5" data-testid={testId} role="list">
      {bars.map((b) => (
        <div
          key={b.key}
          role="listitem"
          tabIndex={0}
          className={cn(
            'relative grid grid-cols-[minmax(0,140px)_minmax(0,1fr)_52px] items-center gap-3 text-[13px] outline-none sm:grid-cols-[minmax(0,170px)_minmax(0,1fr)_56px]',
            b.onClick && 'cursor-pointer',
          )}
          onMouseEnter={() => setHot(b.key)}
          onMouseLeave={() => setHot(null)}
          onFocus={() => setHot(b.key)}
          onBlur={() => setHot(null)}
          onClick={b.onClick}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && b.onClick?.()}
          aria-label={`${b.label}: ${b.value} ${unit}${b.partial ? ' (parcial)' : ''}`}
          data-bar={b.key}
        >
          <span className="truncate font-mono text-[11.5px] text-secondary">{b.label}</span>
          <span className="relative h-2.5 bg-elevated">
            <span
              className={cn('absolute inset-y-0 left-0', hot === b.key ? 'bg-nasa' : 'bg-strong')}
              style={{
                width: `${(b.value / max) * 100}%`,
                ...(b.partial && hot !== b.key
                  ? {
                      background:
                        'repeating-linear-gradient(90deg, var(--vy-strong) 0 6px, transparent 6px 9px)',
                    }
                  : {}),
              }}
            />
          </span>
          <span className="text-right font-mono text-[11.5px] text-strong tabular-nums">
            {b.value}
          </span>
          {hot === b.key && (
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/3 z-20 mb-1.5 border border-strong bg-elevated px-2.5 py-1.5 text-[12px] whitespace-nowrap shadow-layer"
            >
              <b className="font-mono text-strong">{b.value}</b> {unit} · {b.label}
              {total ? ` · ${Math.round((b.value / total) * 100)}%` : ''}
              {b.partial ? ' · semana em andamento' : ''}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
