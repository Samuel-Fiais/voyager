import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

export function Dialog({
  title,
  onClose,
  children,
  testId,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  testId?: string
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])
  // portal no body: dentro da gaveta (com transform) o position: fixed ficaria preso a ela
  return createPortal(
    <div
      className="fixed inset-0 z-40 grid items-start justify-items-center overflow-y-auto bg-black/50 px-4 pt-[60px] pb-10"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-label={title}
        className="grid w-full max-w-[620px] gap-4 border border-strong bg-elevated p-5 shadow-layer"
        data-testid={testId}
      >
        <h2 className="pb-2.5 text-[13px] font-extrabold tracking-[0.1em] text-strong uppercase rule-section">
          {title}
        </h2>
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-[11.5px] font-bold tracking-[0.08em] text-secondary uppercase">
      {label}
      <span className="font-normal tracking-normal normal-case">{children}</span>
    </label>
  )
}

/** Grupo de botões de escolha (não usa <label>, que daria o nome do grupo ao primeiro botão). */
export function ChoiceGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-1.5">
      <legend className="mb-1.5 text-[11.5px] font-bold tracking-[0.08em] text-secondary uppercase">
        {label}
      </legend>
      <span className="flex flex-wrap gap-1.5">{children}</span>
    </fieldset>
  )
}

export const inputClass =
  'w-full border bg-bg px-3 py-2 text-[14px] text-strong outline-none focus:border-strong'
