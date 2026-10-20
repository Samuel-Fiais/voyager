import { glyphShape } from '@/vault/labels'

/** Forma do status centrada em (cx, cy); `sw` é o traço. */
export function StatusShape({
  status,
  cx,
  cy,
  r,
  sw = 1.5,
}: {
  status: string | null | undefined
  cx: number
  cy: number
  r: number
  sw?: number
}) {
  const shape = glyphShape(status)
  return (
    <>
      {shape === 'full-faint' && <circle cx={cx} cy={cy} r={r} fill="var(--vy-faint)" />}
      {(shape === 'ring' || shape === 'ring-faint') && (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={shape === 'ring' ? 'var(--vy-strong)' : 'var(--vy-faint)'}
          strokeWidth={sw}
        />
      )}
      {shape === 'dashed' && (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--vy-strong)"
          strokeWidth={sw}
          strokeDasharray="2 1.6"
        />
      )}
      {shape === 'half' && (
        <>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--vy-strong)" strokeWidth={sw} />
          <path
            d={`M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} Z`}
            fill="var(--vy-strong)"
          />
        </>
      )}
      {shape === 'red' && <circle cx={cx} cy={cy} r={r} fill="var(--vy-nasa)" />}
      {shape === 'struck' && (
        <>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--vy-faint)"
            strokeWidth={sw * 0.8}
          />
          <path
            d={`M ${cx - r} ${cy + r} L ${cx + r} ${cy - r}`}
            stroke="var(--vy-faint)"
            strokeWidth={sw * 0.8}
          />
        </>
      )}
      {shape === 'dot' && <circle cx={cx} cy={cy} r={r * 0.5} fill="var(--vy-faint)" />}
    </>
  )
}

export function StatusGlyph({
  status,
  size = 12,
}: {
  status: string | null | undefined
  size?: number
}) {
  const c = size / 2
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className="shrink-0"
    >
      <StatusShape status={status} cx={c} cy={c} r={size / 2 - 1.2} />
    </svg>
  )
}
