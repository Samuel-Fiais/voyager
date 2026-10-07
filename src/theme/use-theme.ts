import { useCallback, useSyncExternalStore } from 'react'
import { resolveTheme, setTheme, type Theme } from './theme'

// Estado do tema compartilhado por todos os componentes (botão do topo, páginas que mostram o tema).
const listeners = new Set<() => void>()
let current: Theme | null = null

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function snapshot(): Theme {
  current ??= resolveTheme()
  return current
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, snapshot, snapshot)
  const toggle = useCallback(() => {
    const next: Theme = snapshot() === 'dark' ? 'light' : 'dark'
    setTheme(next)
    current = next
    listeners.forEach((l) => l())
  }, [])
  return { theme, toggle }
}

/** Só para testes: esquece o tema memorizado. */
export function resetThemeForTests() {
  current = null
}
