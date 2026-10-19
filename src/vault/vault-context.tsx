import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useWorkspace } from '@/workspace/workspace-context'
import { loadVaultFiles } from './load-files'
import { buildVaultIndex, type VaultIndex } from './vault-index'

interface VaultValue {
  index: VaultIndex | null
  /** commit refletido pelo índice */
  commit: string | null
  loading: boolean
}

const VaultContext = createContext<VaultValue>({ index: null, commit: null, loading: false })

/** Monta o índice do workspace ativo a cada sincronização (novo último commit lido). */
export function VaultProvider({ children }: { children: ReactNode }) {
  const { active } = useWorkspace()
  const id = active?.id ?? null
  const commit = active?.lastCommit ?? null
  const key = id && commit ? `${id}#${commit}` : null
  const [built, setBuilt] = useState<{
    key: string
    id: string
    commit: string
    index: VaultIndex
  } | null>(null)

  useEffect(() => {
    if (!key || !id || !commit) return
    let cancelled = false
    loadVaultFiles(id).then((files) => {
      if (!cancelled) setBuilt({ key, id, commit, index: buildVaultIndex(files) })
    })
    return () => {
      cancelled = true
    }
  }, [key, id, commit])

  // Enquanto o índice novo é montado, o anterior do mesmo workspace continua visível.
  const usable = built && built.id === id ? built : null
  const value: VaultValue = {
    index: usable?.index ?? null,
    commit: usable?.commit ?? null,
    loading: key !== null && built?.key !== key,
  }
  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useVault() {
  return useContext(VaultContext)
}
