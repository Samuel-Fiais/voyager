import { describe, expect, it } from 'vitest'
import { applyStoredTheme, resolveTheme, setTheme, THEME_STORAGE_KEY } from './theme'

describe('tema', () => {
  it('sem escolha guardada, segue o sistema e não fixa data-theme', () => {
    applyStoredTheme()
    expect(document.documentElement.dataset.theme).toBeUndefined()
    expect(resolveTheme()).toBe('dark')
  })

  it('guarda a escolha e a reaplica', () => {
    setTheme('light')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    delete document.documentElement.dataset.theme
    applyStoredTheme()
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(resolveTheme()).toBe('light')
  })

  it('ignora valor inválido no armazenamento', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'sepia')
    expect(resolveTheme()).toBe('dark')
  })
})
