import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/workspace/workspace-context'
import { useWriter } from './writer'

function DiffLine({ line }: { line: string }) {
  return (
    <span
      className={cn(
        'block',
        line.startsWith('+') ? 'text-strong' : line.startsWith('-') ? 'text-nasa' : 'text-faint',
      )}
    >
      {line}
    </span>
  )
}

/** Folha de confirmação: diff, auditoria e mensagem antes de gravar (R10); conflito e erro. */
export function CommitSheet() {
  const { state, plan, setReason, confirm, resync, cancel } = useWriter()
  const { active } = useWorkspace()
  const reasonRef = useRef<HTMLInputElement>(null)
  const open = state !== null
  useEffect(() => {
    if (open) reasonRef.current?.focus()
  }, [open])
  useEffect(() => {
    if (!open) return
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancel()
    }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [open, cancel])
  if (!state) return null
  const reasonInfo = state.request.reason
  const busy = state.phase === 'committing'
  const blocked = !plan || plan.errors.length > 0

  return (
    <div
      className="fixed inset-0 z-40 grid items-end justify-items-center bg-black/50"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && cancel()}
    >
      <div
        role="dialog"
        aria-label="Confirmar e commitar"
        className="grid max-h-[90dvh] w-full max-w-[740px] gap-4 overflow-auto border border-b-0 border-strong bg-elevated px-4 pt-5 pb-5 shadow-layer sm:px-6"
        data-testid="commit-sheet"
      >
        <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 pb-2.5 rule-section">
          <b className="text-[22px] font-extrabold text-strong sm:text-[26px]">
            {plan?.title ?? '…'}
          </b>
          <span className="text-[13.5px] text-secondary">commit direto em {active?.branch}</span>
        </div>

        {state.phase === 'conflict' && state.conflict ? (
          <div
            className="border-l-[3px] border-nasa bg-bg px-3 py-2 text-[13.5px] text-secondary"
            data-testid="conflict"
          >
            <b className="block text-strong">A branch avançou e mudou o mesmo arquivo.</b>
            {state.conflict.paths.map((p) => (
              <span key={p} className="block font-mono text-[12px]">
                {p}
              </span>
            ))}
            Nada foi gravado. Sincronize para ver a versão nova; a alteração é refeita sobre ela e
            volta para você confirmar.
          </div>
        ) : null}

        {state.phase === 'error' && (
          <div
            className="border-l-[3px] border-nasa bg-bg px-3 py-2 text-[13.5px] text-secondary"
            role="alert"
          >
            Falha ao gravar: {state.error}
          </div>
        )}

        {reasonInfo && (
          <label className="grid gap-1.5 text-[11.5px] font-bold tracking-[0.08em] text-secondary uppercase">
            {reasonInfo.label}
            {reasonInfo.required ? ' *' : ''}
            <input
              ref={reasonRef}
              className="border bg-bg px-3 py-2 text-[14px] font-normal tracking-normal text-strong normal-case outline-none focus:border-strong"
              value={state.reason}
              onChange={(e) => setReason(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !blocked) void confirm()
              }}
              autoComplete="off"
              data-testid="reason"
            />
          </label>
        )}

        {plan && (
          <div
            className="overflow-x-auto border bg-bg px-3.5 py-3 font-mono text-[11.5px] leading-[1.7] whitespace-pre"
            data-testid="commit-diff"
          >
            {plan.diffs.map((d) => (
              <div key={d.path} className="mb-2">
                <span className="block text-faint">{d.path}</span>
                {d.lines.map((l, i) => (
                  <DiffLine key={i} line={l} />
                ))}
              </div>
            ))}
            {plan.auditLines.map((a) => (
              <div key={a.path}>
                <span className="block text-faint">
                  {' '}
                  ## Auditoria{plan.auditLines.length > 1 ? ` · ${a.path.split('/').pop()}` : ''}
                </span>
                <span className="block text-strong">+ {a.line}</span>
              </div>
            ))}
            <span className="mt-2 block text-faint">commit: "{plan.message}"</span>
          </div>
        )}

        {plan && plan.errors.length > 0 && (
          <ul
            className="grid gap-1 border-l-[3px] border-nasa bg-bg px-3 py-2 text-[13px] text-secondary"
            data-testid="commit-errors"
          >
            {plan.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <small className="text-[12px] text-faint">
            Validado pelas regras do validar-vault.py. O board Multica não é sincronizado.
          </small>
          <div className="flex gap-2.5">
            <Button onClick={cancel} disabled={busy}>
              {state.phase === 'conflict' ? 'Descartar' : 'Cancelar'}
            </Button>
            {state.phase === 'conflict' ? (
              <Button variant="commit" onClick={() => void resync()} data-testid="resync">
                Sincronizar e refazer
              </Button>
            ) : (
              <Button
                variant="commit"
                onClick={() => void confirm()}
                disabled={blocked || busy}
                data-testid="confirm-commit"
              >
                {busy ? 'Gravando…' : 'Confirmar e commitar'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function WriteToast() {
  const { toast } = useWriter()
  if (!toast) return null
  return (
    <div
      role="status"
      className="fixed right-4 bottom-4 z-50 grid max-w-[calc(100vw-2rem)] min-w-[280px] gap-0.5 bg-strong px-4 py-3 text-bg shadow-layer"
      data-testid="toast"
    >
      <b className="text-[11.5px] font-extrabold tracking-[0.08em] uppercase">{toast.title}</b>
      <span className="font-mono text-[11.5px]">{toast.text}</span>
    </div>
  )
}
