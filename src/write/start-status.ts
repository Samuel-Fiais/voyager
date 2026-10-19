import { useCallback } from 'react'
import { planStatusChange } from './plan'
import { reasonLabel, REASON_REQUIRED } from './status-rules'
import { useWriter } from './writer'

/** Abre a folha de confirmação de uma mudança de status, refeita sempre sobre a versão atual da nota. */
export function useStartStatusChange() {
  const { start } = useWriter()
  return useCallback(
    (path: string, to: string) =>
      start({
        makePlan: (idx, reason, actor) => {
          const current = idx.notes.get(path)
          return current ? planStatusChange({ index: idx, note: current, to, reason, actor }) : null
        },
        reason: { label: reasonLabel(to), required: REASON_REQUIRED.has(to) },
      }),
    [start],
  )
}
