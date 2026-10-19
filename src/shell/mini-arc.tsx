import type { Note } from '@/vault/vault-index'

/** Mini-trajetória do projeto na sidebar: um traço por task; vermelho quando bloqueada. */
export function MiniArc({ tasks }: { tasks: Note[] }) {
  const W = 200
  const H = 14
  const n = Math.max(tasks.length, 1)
  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line x1="2" y1={H / 2} x2={W - 2} y2={H / 2} stroke="var(--vy-orbit)" strokeWidth="1" />
      {tasks.map((t, i) => {
        const x = 2 + ((i + 0.5) / n) * (W - 4)
        const color =
          t.status === 'blocked'
            ? 'var(--vy-nasa)'
            : t.status === 'done'
              ? 'var(--vy-faint)'
              : 'var(--vy-strong)'
        const h = t.status === 'done' ? 4 : t.status === 'blocked' ? 10 : 8
        return (
          <rect key={t.path} x={x - 0.6} y={H / 2 - h / 2} width="1.2" height={h} fill={color} />
        )
      })}
    </svg>
  )
}
