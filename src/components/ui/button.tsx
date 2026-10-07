import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

// Botão shadcn/ui restilizado pelo VO-DS001: sem raios, borda de 1px, rótulo em caixa alta.
// A variante `commit` (vermelho NASA) é exclusiva de ações que gravam no repositório.
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 border text-label font-medium tracking-[0.08em] uppercase whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-line bg-elevated text-strong hover:border-strong',
        commit: 'border-nasa bg-nasa text-white hover:brightness-110',
        ghost: 'border-transparent bg-transparent text-secondary hover:text-strong',
      },
      size: {
        default: 'h-8 px-3',
        icon: 'size-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export function Button({
  className,
  variant,
  size,
  ...props
}: ComponentProps<'button'> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
