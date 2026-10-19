import { useNavigate, useSearch } from '@tanstack/react-router'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useWorkspace } from '@/workspace/workspace-context'
import type { NavId } from './nav-ids'

// Navegação do shell: a view atual fica na URL (?v=), as abas e os recentes por workspace.

interface NavState {
  tabs: NavId[]
  recent: NavId[]
}

interface NavValue extends NavState {
  current: NavId | null
  open: (id: NavId) => void
  close: (id: NavId) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  paletteOpen: boolean
  setPaletteOpen: (open: boolean) => void
}

const NavContext = createContext<NavValue | null>(null)
const DEFAULT: NavState = { tabs: ['painel'], recent: [] }

function storageKey(ws: string) {
  return `voyager.nav.${ws}`
}

function load(ws: string | undefined): NavState {
  if (!ws) return DEFAULT
  try {
    const raw = localStorage.getItem(storageKey(ws))
    if (!raw) return DEFAULT
    const s = JSON.parse(raw) as NavState
    return Array.isArray(s.tabs) && Array.isArray(s.recent) ? s : DEFAULT
  } catch {
    return DEFAULT
  }
}

export function NavProvider({ children }: { children: ReactNode }) {
  const { active } = useWorkspace()
  const ws = active?.id
  const search = useSearch({ strict: false }) as { v?: string }
  const navigate = useNavigate()
  const [state, setState] = useState<{ ws?: string; nav: NavState }>(() => ({ ws, nav: load(ws) }))
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)

  // Troca de workspace: carrega as abas e os recentes daquele workspace.
  const nav = state.ws === ws ? state.nav : load(ws)
  if (state.ws !== ws) setState({ ws, nav })

  useEffect(() => {
    if (!ws) return
    try {
      localStorage.setItem(storageKey(ws), JSON.stringify(nav))
    } catch {
      // sem armazenamento, as abas valem só nesta aba do navegador
    }
  }, [ws, nav])

  const current = search.v ?? (nav.tabs.length ? nav.tabs[0] : null)
  // Abrir pela URL (link direto, voltar do navegador) também mostra a aba.
  const tabs = useMemo(
    () => (current && !nav.tabs.includes(current) ? [...nav.tabs, current] : nav.tabs),
    [current, nav.tabs],
  )

  const open = useCallback(
    (id: NavId) => {
      setState((s) => ({
        ws: s.ws,
        nav: {
          tabs: s.nav.tabs.includes(id) ? s.nav.tabs : [...s.nav.tabs, id],
          recent: [id, ...s.nav.recent.filter((r) => r !== id)].slice(0, 12),
        },
      }))
      setSidebarOpen(false)
      setPaletteOpen(false)
      void navigate({ to: '/', search: { v: id } })
    },
    [navigate],
  )

  const close = useCallback(
    (id: NavId) => {
      const i = tabs.indexOf(id)
      if (i < 0) return
      const remaining = tabs.filter((t) => t !== id)
      setState((s) => ({ ws: s.ws, nav: { ...s.nav, tabs: remaining } }))
      if (current === id) {
        const next = remaining[Math.min(i, remaining.length - 1)]
        void navigate({ to: '/', search: next ? { v: next } : { v: '' } })
      }
    },
    [tabs, current, navigate],
  )

  const value = useMemo<NavValue>(
    () => ({
      ...nav,
      tabs,
      current: current === '' ? null : current,
      open,
      close,
      sidebarOpen,
      setSidebarOpen,
      paletteOpen,
      setPaletteOpen,
    }),
    [nav, tabs, current, open, close, sidebarOpen, paletteOpen],
  )
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNav() {
  const v = useContext(NavContext)
  if (!v) throw new Error('useNav fora do NavProvider')
  return v
}
