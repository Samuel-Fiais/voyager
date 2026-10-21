import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Columns3,
  Ellipsis,
  Folder,
  LayoutGrid,
  Menu,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Sun,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Ícones de interface do VO-DS001 (lucide, a biblioteca do shadcn/ui): traço fino, cor do texto.
// Nada de caracteres (☀ ⋯ ▾ ×), que mudam de fonte, tamanho e linha de base conforme o sistema.
const ICONS = {
  sun: Sun,
  moon: Moon,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  'chevron-down': ChevronDown,
  'arrow-left': ArrowLeft,
  close: X,
  menu: Menu,
  plus: Plus,
  search: Search,
  sync: RefreshCw,
  more: Ellipsis,
  painel: LayoutGrid,
  kanban: Columns3,
  demandas: Clock,
  arquivos: Folder,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof ICONS

export function Icon({
  name,
  size = 16,
  className,
}: {
  name: IconName
  size?: number
  className?: string
}) {
  const Glyph = ICONS[name]
  return (
    <Glyph
      size={size}
      strokeWidth={1.5}
      absoluteStrokeWidth
      aria-hidden="true"
      className={cn('block shrink-0', className)}
    />
  )
}
