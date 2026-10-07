import { liveQuery } from 'dexie'
import { useEffect, useState } from 'react'

/** Resultado de uma consulta do Dexie que se atualiza quando os dados mudam. */
export function useLiveQuery<T>(query: () => Promise<T>, deps: unknown[], initial: T): T {
  const [value, setValue] = useState<T>(initial)
  useEffect(() => {
    const sub = liveQuery(query).subscribe({ next: setValue, error: () => undefined })
    return () => sub.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return value
}
