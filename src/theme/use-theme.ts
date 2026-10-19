import { useCallback, useState } from 'react'
import { resolveTheme, setTheme, type Theme } from './theme'

export function useTheme() {
  const [theme, setState] = useState<Theme>(resolveTheme)

  const toggle = useCallback(() => {
    setState((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark'
      setTheme(next)
      return next
    })
  }, [])

  return { theme, toggle }
}
