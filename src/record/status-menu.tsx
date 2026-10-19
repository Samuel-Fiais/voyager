import { useEffect, useRef, useState } from 'react'
import { StatusGlyph } from '@/components/status-glyph'
import { cn } from '@/lib/utils'
import { transitionsFrom } from '@/vault/contracts'
import { statusLabel } from '@/vault/labels'
import { useVault } from '@/vault/vault-context'
import type { Note } from '@/vault/vault-index'
import { useStartStatusChange } from '@/write/start-status'

/**
 * Menu de status com as transições do contrato do type; escolher abre a folha de confirmação.
 * `variant="more"` é o ⋯ dos cards do kanban (alternativa ao arrastar, também por teclado).
 */
export function StatusMenu({
  note,
  variant = 'button',
}: {
  note: Note
  variant?: 'button' | 'more'
}) {
  const { index } = useVault()
  const startChange = useStartStatusChange()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const first = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    first.current?.focus()
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])
  if (!index || !note.type) return null
  const options = transitionsFrom(index.contracts, note.type, note.status)
  const condition = (s: string) =>
    note.type === 'task'
      ? (index.contracts.taskStatuses.find((t) => t.status === s)?.condition ?? '')
      : ''

  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const items = [...(ref.current?.querySelectorAll<HTMLButtonElement>('[role=menuitem]') ?? [])]
    const i = items.indexOf(document.activeElement as HTMLButtonElement)
    items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus()
  }

  return (
    <div
      className="relative"
      ref={ref}
      onPointerDown={(e) => variant === 'more' && e.stopPropagation()}
    >
      {variant === 'more' ? (
        <button
          className="px-1 text-[15px] leading-none text-faint hover:text-strong focus-visible:text-strong"
          onClick={(e) => {
            e.stopPropagation()
            setOpen((o) => !o)
          }}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Mudar o status de ${note.code}`}
          data-testid="card-more"
        >
          ⋯
        </button>
      ) : (
        <button
          className={cn(
            'inline-flex items-center gap-2 border px-2.5 py-[5px] text-[12px] font-semibold tracking-[0.04em] hover:bg-elevated',
            note.status === 'blocked' && 'border-nasa text-nasa',
          )}
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          data-testid="status-button"
        >
          <StatusGlyph status={note.status} size={11} />
          {statusLabel(note.status)} ▾
        </button>
      )}
      {open && (
        <div
          role="menu"
          onKeyDown={onMenuKey}
          className={cn(
            'absolute top-full z-30 mt-1.5 w-[300px] max-w-[calc(100vw-2rem)] border border-strong bg-elevated text-left shadow-layer',
            variant === 'more' ? 'right-0' : 'left-0',
          )}
          data-testid="status-menu"
        >
          <div className="border-b px-3 pt-2.5 pb-2 text-[11px] font-bold tracking-[0.08em] text-faint uppercase">
            {note.code} · próximos status do contrato
          </div>
          {options.map((s, i) => (
            <button
              key={s}
              ref={i === 0 ? first : undefined}
              role="menuitem"
              className="grid w-full grid-cols-[16px_minmax(0,1fr)] items-start gap-2.5 px-3 py-[9px] text-left hover:bg-panel focus-visible:bg-panel focus-visible:outline-none"
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                startChange(note.path, s)
              }}
              data-status={s}
            >
              <StatusGlyph status={s} size={12} />
              <span>
                <b className="block text-[13px] font-semibold text-strong">{statusLabel(s)}</b>
                {condition(s) && <small className="text-[12px] text-faint">{condition(s)}</small>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
