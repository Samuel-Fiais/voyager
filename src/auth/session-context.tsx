import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { GitHubClient } from '@/github/client'
import { loadSession, logout as doLogout, type Session } from './session'

interface SessionValue {
  session: Session | null
  github: GitHubClient | null
  setSession: (session: Session | null) => void
  logout: () => Promise<{ revoked: boolean }>
}

const SessionContext = createContext<SessionValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadSession)
  const logout = useCallback(async () => {
    const result = await doLogout(session)
    setSession(null)
    return result
  }, [session])
  const value = useMemo<SessionValue>(
    () => ({
      session,
      github: session ? new GitHubClient(session.token) : null,
      setSession,
      logout,
    }),
    [session, logout],
  )
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession() {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useSession fora do SessionProvider')
  return value
}
