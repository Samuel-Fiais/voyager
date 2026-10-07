import { useEffect, useRef, useState } from 'react'
import { StatusGlyph } from '@/components/status-glyph'
import { cn } from '@/lib/utils'
import { transitionsFrom } from '@/vault/contracts'
import { statusLabel } from '@/vault/labels'
import { useVault } from '@/vault/vault-context'
import type { Note } from '@/vault/vault-index'
import { planStatusChange } from '@/write/plan'
import { reasonLabel, REASON_REQUIRED } from '@/write/status-rules'
import { useWriter } from '@/write/writer'

/** Menu de status com as transições do contrato do type; escolher abre a folha de confirmação. */
export function StatusMenu({ note }: { note: Note }) {
  const { index } = useVault()
  const { start } = useWriter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
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

  return (
    <div className="relative" ref={ref}>
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
      {open && (
        <div
          role="menu"
          className="absolute top-full left-0 z-30 mt-1.5 w-[300px] max-w-[calc(100vw-2rem)] border border-strong bg-elevated shadow-layer"
          data-testid="status-menu"
        >
          <div className="border-b px-3 pt-2.5 pb-2 text-[11px] font-bold tracking-[0.08em] text-faint uppercase">
            {note.code} · status do contrato de {note.type}
          </div>
          {options.map((s) => (
            <button
              key={s}
              role="menuitem"
              className="grid w-full grid-cols-[16px_minmax(0,1fr)] items-start gap-2.5 px-3 py-[9px] text-left hover:bg-panel"
              onClick={() => {
                setOpen(false)
                const path = note.path
                start({
                  makePlan: (idx, reason, actor) => {
                    const current = idx.notes.get(path)
                    return current
                      ? planStatusChange({ index: idx, note: current, to: s, reason, actor })
                      : null
                  },
                  reason: { label: reasonLabel(s), required: REASON_REQUIRED.has(s) },
                })
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
