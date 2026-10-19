import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { onLogout } from '@/auth/session'
import { useSession } from '@/auth/session-context'
import { useLiveQuery } from '@/lib/use-live-query'
import { clearAll, db, removeWorkspace, workspaceId, type WorkspaceRecord } from '@/storage/db'
import { syncWorkspace, type SyncError, type SyncProgress, type SyncResult } from '@/sync/sync'

export const ACTIVE_KEY = 'voyager.workspace'
export const DEFAULT_INTERVAL_MIN = 10

// Sair apaga a cópia local de todos os vaults e a escolha do workspace (R14).
onLogout(async () => {
  await clearAll(db)
  localStorage.removeItem(ACTIVE_KEY)
})

export interface SyncState {
  status: 'idle' | 'syncing' | 'error'
  progress?: SyncProgress
  last?: SyncResult
  error?: SyncError
}

interface WorkspaceValue {
  workspaces: WorkspaceRecord[]
  active: WorkspaceRecord | null
  loaded: boolean
  sync: SyncState
  select: (id: string) => void
  add: (owner: string, repo: string, branch: string) => Promise<void>
  remove: (id: string) => Promise<void>
  syncNow: () => Promise<void>
  setInterval: (minutes: number) => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null)

function readActive() {
  try {
    return localStorage.getItem(ACTIVE_KEY)
  } catch {
    return null
  }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { github } = useSession()
  const list = useLiveQuery(() => db.workspaces.toArray().then((w) => ({ w })), [], null)
  const workspaces = useMemo(() => list?.w ?? [], [list])
  const [activeId, setActiveId] = useState<string | null>(readActive)
  const [sync, setSync] = useState<SyncState>({ status: 'idle' })
  const running = useRef(false)

  const active =
    workspaces.find((w) => w.id === activeId) ?? (workspaces.length ? workspaces[0] : null)

  const select = useCallback((id: string) => {
    localStorage.setItem(ACTIVE_KEY, id)
    setActiveId(id)
    setSync({ status: 'idle' })
  }, [])

  const run = useCallback(
    async (ws: WorkspaceRecord) => {
      if (!github || running.current) return
      running.current = true
      setSync((s) => ({ ...s, status: 'syncing', error: undefined }))
      try {
        const last = await syncWorkspace(github, db, ws, (progress) =>
          setSync((s) => ({ ...s, progress })),
        )
        setSync({ status: 'idle', last })
      } catch (error) {
        setSync({ status: 'error', error: error as SyncError })
      } finally {
        running.current = false
      }
    },
    [github],
  )

  const add = useCallback(
    async (owner: string, repo: string, branch: string) => {
      const id = workspaceId(owner, repo, branch)
      const existing = await db.workspaces.get(id)
      const ws: WorkspaceRecord = existing ?? {
        id,
        owner,
        repo,
        branch,
        lastCommit: null,
        lastTree: null,
        lastSyncAt: null,
        syncIntervalMin: DEFAULT_INTERVAL_MIN,
        fileCount: 0,
        createdAt: new Date().toISOString(),
      }
      await db.workspaces.put(ws)
      select(id)
      // A sincronização segue em segundo plano; o progresso aparece no topo.
      void run(ws)
    },
    [run, select],
  )

  const remove = useCallback(
    async (id: string) => {
      await removeWorkspace(db, id)
      if (activeId === id) {
        localStorage.removeItem(ACTIVE_KEY)
        setActiveId(null)
      }
    },
    [activeId],
  )

  const syncNow = useCallback(async () => {
    if (!active) return
    const fresh = await db.workspaces.get(active.id)
    if (fresh) await run(fresh)
  }, [active, run])

  const setIntervalMin = useCallback(
    async (minutes: number) => {
      if (active) await db.workspaces.update(active.id, { syncIntervalMin: minutes })
    },
    [active],
  )

  // Sincronização automática no intervalo do workspace, enquanto o app está aberto.
  const interval = active?.syncIntervalMin ?? 0
  useEffect(() => {
    if (!active || !interval) return
    const timer = window.setInterval(() => void syncNow(), interval * 60_000)
    return () => window.clearInterval(timer)
  }, [active, interval, syncNow])

  const value = useMemo<WorkspaceValue>(
    () => ({
      workspaces,
      active,
      loaded: list !== null,
      sync,
      select,
      add,
      remove,
      syncNow,
      setInterval: setIntervalMin,
    }),
    [workspaces, active, list, sync, select, add, remove, syncNow, setIntervalMin],
  )
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWorkspace() {
  const value = useContext(WorkspaceContext)
  if (!value) throw new Error('useWorkspace fora do WorkspaceProvider')
  return value
}
