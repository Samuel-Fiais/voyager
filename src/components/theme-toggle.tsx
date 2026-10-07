import { Button } from '@/components/ui/button'
import { useTheme } from '@/theme/use-theme'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
      title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
      data-testid="theme-toggle"
    >
      <span aria-hidden="true" className="text-base normal-case">
        {theme === 'dark' ? '☀' : '☾'}
      </span>
    </Button>
  )
}
