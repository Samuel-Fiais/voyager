import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { useSession } from '@/auth/session-context'
import { db } from '@/storage/db'
import { useVault } from '@/vault/vault-context'
import type { VaultIndex } from '@/vault/vault-index'
import { useWorkspace } from '@/workspace/workspace-context'
import { commitChanges, ConflictError } from './commit'
import type { WritePlan } from './plan'

// Único caminho de gravação da interface: planeja, mostra a folha de confirmação (R10),
// valida (R09), commita (R08) e sincroniza. Conflitos voltam para Samuel decidir.

export interface WriteRequest {
  /** monta o plano a partir do índice atual e do motivo digitado */
  makePlan: (index: VaultIndex, reason: string, actor: string) => WritePlan | null
  reason?: { label: string; required: boolean }
}

export type WritePhase = 'confirm' | 'committing' | 'conflict' | 'error'

export interface WriteState {
  request: WriteRequest
  reason: string
  phase: WritePhase
  conflict?: ConflictError
  error?: string
}

interface Toast {
  title: string
  text: string
}

interface WriterValue {
  state: WriteState | null
  plan: WritePlan | null
  toast: Toast | null
  actor: string
  start: (request: WriteRequest) => void
  setReason: (reason: string) => void
  confirm: () => Promise<void>
  resync: () => Promise<void>
  cancel: () => void
}

const WriterContext = createContext<WriterValue | null>(null)

export function WriterProvider({ children }: { children: ReactNode }) {
  const { session, github } = useSession()
  const { active, syncNow } = useWorkspace()
  const { index } = useVault()
  const [state, setState] = useState<WriteState | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const actor = session?.name?.trim() || session?.login || 'Samuel Fiais'

  const plan = useMemo(
    () => (state && index ? state.request.makePlan(index, state.reason, actor) : null),
    [state, index, actor],
  )

  const showToast = useCallback((t: Toast) => {
    setToast(t)
    window.setTimeout(() => setToast((cur) => (cur === t ? null : cur)), 4000)
  }, [])

  const start = useCallback(
    (request: WriteRequest) => setState({ request, reason: '', phase: 'confirm' }),
    [],
  )
  const setReason = useCallback((reason: string) => setState((s) => (s ? { ...s, reason } : s)), [])
  const cancel = useCallback(() => setState(null), [])

  const confirm = useCallback(async () => {
    if (!state || !plan || plan.errors.length || !github || !active) return
    setState({ ...state, phase: 'committing' })
    try {
      const ws = (await db.workspaces.get(active.id)) ?? active
      const res = await commitChanges(github, ws, plan.changes, plan.message)
      await syncNow()
      setState(null)
      showToast({
        title: `Commit ${res.commit.slice(0, 7)} em ${ws.branch}`,
        text: `${plan.title} · auditoria registrada${res.rebased ? ' · reaplicado sobre commits novos' : ''}`,
      })
    } catch (e) {
      if (e instanceof ConflictError) setState({ ...state, phase: 'conflict', conflict: e })
      else setState({ ...state, phase: 'error', error: e instanceof Error ? e.message : String(e) })
    }
  }, [state, plan, github, active, syncNow, showToast])

  /** Sincroniza e volta à confirmação com o plano refeito sobre a versão nova. */
  const resync = useCallback(async () => {
    if (!state) return
    await syncNow()
    setState({ ...state, phase: 'confirm', conflict: undefined, error: undefined })
  }, [state, syncNow])

  const value = useMemo<WriterValue>(
    () => ({ state, plan, toast, actor, start, setReason, confirm, resync, cancel }),
    [state, plan, toast, actor, start, setReason, confirm, resync, cancel],
  )
  return <WriterContext.Provider value={value}>{children}</WriterContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWriter() {
  const v = useContext(WriterContext)
  if (!v) throw new Error('useWriter fora do WriterProvider')
  return v
}
