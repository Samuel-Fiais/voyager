import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { THEME_STORAGE_KEY } from './theme/theme'

describe('App (fumaça)', () => {
  it('renderiza a página de tokens do VO-DS001', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Tokens de design' })).toBeInTheDocument()
    expect(screen.getAllByText('VOYAGER').length).toBeGreaterThan(0)
    expect(screen.getByTestId('swatch-nasa')).toBeInTheDocument()
  })

  it('alterna o tema e guarda a escolha', async () => {
    render(<App />)
    const toggle = screen.getByTestId('theme-toggle')
    const before = document.documentElement.dataset.theme ?? 'dark'
    await userEvent.click(toggle)
    const after = document.documentElement.dataset.theme
    expect(after).not.toBe(before)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe(after)
  })
})
