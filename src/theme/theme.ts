export type Theme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'voyager.theme'

/** Escolha guardada pelo botão de tema; sem escolha, o app segue o sistema. */
export function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'dark' || value === 'light' ? value : null
  } catch {
    return null
  }
}

export function systemTheme(): Theme {
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'
}

export function resolveTheme(): Theme {
  return storedTheme() ?? systemTheme()
}

/** Aplica a escolha guardada antes da primeira pintura. */
export function applyStoredTheme(root: HTMLElement = document.documentElement) {
  const theme = storedTheme()
  if (theme) root.dataset.theme = theme
  else delete root.dataset.theme
}

export function setTheme(theme: Theme, root: HTMLElement = document.documentElement) {
  root.dataset.theme = theme
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Sem armazenamento, a escolha vale só nesta aba.
  }
}
