import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { DEFAULT_INTERVAL_MIN, useWorkspace } from './workspace-context'

const INTERVALS = [0, 5, 10, 30, 60]

export function WorkspaceSwitcher({ onAdd }: { onAdd: () => void }) {
  const { workspaces, active, select, remove, setInterval } = useWorkspace()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  if (!active) return null
  return (
    <div className="relative min-w-0" ref={ref}>
      <button
        className="flex max-w-full min-w-0 items-baseline gap-2 border border-transparent px-2 py-1 hover:border-line"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        data-testid="workspace-switcher"
      >
        <span className="truncate text-strong">{active.repo}</span>
        <span className="hidden shrink-0 font-mono text-label text-faint sm:inline">
          {active.branch}
        </span>
        <span aria-hidden="true" className="text-faint">
          ▾
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-full left-0 z-30 mt-1 w-72 max-w-[calc(100vw-2rem)] border bg-elevated shadow-layer"
        >
          <p className="px-3 pt-3 label-caps">Workspaces</p>
          <ul className="py-1">
            {workspaces.map((w) => (
              <li key={w.id}>
                <button
                  role="menuitemradio"
                  aria-checked={w.id === active.id}
                  className={cn(
                    'flex w-full items-baseline justify-between gap-2 px-3 py-1.5 text-left hover:bg-panel',
                    w.id === active.id && 'text-strong',
                  )}
                  onClick={() => {
                    select(w.id)
                    setOpen(false)
                  }}
                >
                  <span className="truncate">
                    {w.owner}/{w.repo}
                  </span>
                  <span className="shrink-0 font-mono text-label text-faint">{w.branch}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t px-3 py-2">
            <label className="flex items-center justify-between gap-2 text-label text-faint">
              <span className="label-caps">Sincronizar sozinho</span>
              <select
                className="border bg-panel px-1 py-0.5 text-strong"
                value={active.syncIntervalMin ?? DEFAULT_INTERVAL_MIN}
                onChange={(e) => void setInterval(Number(e.target.value))}
                data-testid="sync-interval"
              >
                {INTERVALS.map((m) => (
                  <option key={m} value={m}>
                    {m === 0 ? 'desligado' : `a cada ${m} min`}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-col border-t py-1">
            <button
              role="menuitem"
              className="px-3 py-1.5 text-left hover:bg-panel"
              onClick={() => {
                setOpen(false)
                onAdd()
              }}
            >
              Adicionar workspace
            </button>
            <button
              role="menuitem"
              className="px-3 py-1.5 text-left text-faint hover:bg-panel hover:text-strong"
              onClick={() => {
                if (window.confirm(`Apagar a cópia local de ${active.repo}@${active.branch}?`)) {
                  void remove(active.id)
                  setOpen(false)
                }
              }}
            >
              Remover a cópia deste workspace
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
