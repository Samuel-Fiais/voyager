import { Button } from '@/components/ui/button'
import { Icon } from '@/components/icon'
import { cn } from '@/lib/utils'
import { useTheme } from '@/theme/use-theme'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  return (
    <Button
      size="icon"
      variant="ghost"
      className={cn(className)}
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
      title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
      data-testid="theme-toggle"
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </Button>
  )
}
