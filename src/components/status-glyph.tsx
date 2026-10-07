import { glyphShape } from '@/vault/labels'

export function StatusGlyph({
  status,
  size = 12,
}: {
  status: string | null | undefined
  size?: number
}) {
  const c = size / 2
  const r = size / 2 - 1.2
  const shape = glyphShape(status)
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className="shrink-0"
    >
      {shape === 'full-faint' && <circle cx={c} cy={c} r={r} fill="var(--vy-faint)" />}
      {(shape === 'ring' || shape === 'ring-faint') && (
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke={shape === 'ring' ? 'var(--vy-strong)' : 'var(--vy-faint)'}
          strokeWidth="1.5"
        />
      )}
      {shape === 'dashed' && (
        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="var(--vy-strong)"
          strokeWidth="1.5"
          strokeDasharray="2 1.6"
        />
      )}
      {shape === 'half' && (
        <>
          <circle cx={c} cy={c} r={r} fill="none" stroke="var(--vy-strong)" strokeWidth="1.5" />
          <path d={`M ${c} ${c - r} A ${r} ${r} 0 0 1 ${c} ${c + r} Z`} fill="var(--vy-strong)" />
        </>
      )}
      {shape === 'red' && <circle cx={c} cy={c} r={r} fill="var(--vy-nasa)" />}
      {shape === 'struck' && (
        <>
          <circle cx={c} cy={c} r={r} fill="none" stroke="var(--vy-faint)" strokeWidth="1.2" />
          <path d={`M 2 ${size - 2} L ${size - 2} 2`} stroke="var(--vy-faint)" strokeWidth="1.2" />
        </>
      )}
      {shape === 'dot' && <circle cx={c} cy={c} r={r * 0.5} fill="var(--vy-faint)" />}
    </svg>
  )
}
