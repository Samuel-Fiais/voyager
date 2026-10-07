import { useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useVault } from '@/vault/vault-context'
import { useNav } from './nav'
import { navMeta } from './nav-meta'

// Celular (W11): um item por tela, navegação inferior, voltar e deslize entre os itens abertos.

export const MOBILE = '(max-width: 779px)'

/** Barra do item atual: voltar, código e posição; setas para o vizinho. */
export function MobileItemBar() {
  const { tabs, current, open } = useNav()
  const { index } = useVault()
  const i = current ? tabs.indexOf(current) : -1
  const meta = current ? navMeta(current, index) : null
  const prev = i > 0 ? tabs[i - 1] : null
  const next = i >= 0 && i < tabs.length - 1 ? tabs[i + 1] : null
  return (
    <div
      className="flex h-[38px] items-center gap-2 border-b bg-panel px-2 text-[12.5px]"
      data-testid="mobile-bar"
    >
      <button
        className="px-2 py-1 text-secondary hover:text-strong"
        onClick={() => window.history.back()}
        aria-label="Voltar"
        data-testid="back"
      >
        ← Voltar
      </button>
      <span className="min-w-0 flex-1 truncate text-center font-mono text-[11px] text-faint">
        {meta ? `${meta.code} · ${i + 1}/${tabs.length}` : ''}
      </span>
      <button
        className="px-2 py-1 text-secondary disabled:opacity-30"
        disabled={!prev}
        onClick={() => prev && open(prev)}
        aria-label="Item anterior"
      >
        ‹
      </button>
      <button
        className="px-2 py-1 text-secondary disabled:opacity-30"
        disabled={!next}
        onClick={() => next && open(next)}
        aria-label="Próximo item"
      >
        ›
      </button>
    </div>
  )
}

/** Deslizar o conteúdo para os lados troca para o item aberto vizinho. */
export function Swipeable({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const { tabs, current, open } = useNav()
  const start = useRef<{ x: number; y: number } | null>(null)
  return (
    <div
      className="h-full min-h-0 overflow-auto"
      data-testid="view"
      onPointerDown={(e) => {
        if (enabled && e.pointerType === 'touch') start.current = { x: e.clientX, y: e.clientY }
      }}
      onPointerUp={(e) => {
        const s = start.current
        start.current = null
        if (!s || !current) return
        const dx = e.clientX - s.x
        const dy = e.clientY - s.y
        if (Math.abs(dx) < 70 || Math.abs(dy) > 50) return
        // não troca de item se o gesto foi para rolar um conteúdo largo (kanban, tabela)
        const scroller = (e.target as Element).closest('[data-hscroll]')
        if (scroller && scroller.scrollWidth > scroller.clientWidth) return
        const i = tabs.indexOf(current)
        const to = dx < 0 ? tabs[i + 1] : tabs[i - 1]
        if (to) open(to)
      }}
      onPointerCancel={() => (start.current = null)}
    >
      {children}
    </div>
  )
}

export function BottomNav() {
  const { current, open, setSidebarOpen, sidebarOpen, setPaletteOpen, paletteOpen } = useNav()
  const items: { id: string; label: string; on: boolean; act: () => void }[] = [
    {
      id: 'painel',
      label: 'Painel',
      on: current === 'painel' && !sidebarOpen,
      act: () => open('painel'),
    },
    {
      id: 'kanban',
      label: 'Kanban',
      on: current === 'kanban' && !sidebarOpen,
      act: () => open('kanban'),
    },
    { id: 'vault', label: 'Vault', on: sidebarOpen, act: () => setSidebarOpen(!sidebarOpen) },
    { id: 'buscar', label: 'Buscar', on: paletteOpen, act: () => setPaletteOpen(true) },
  ]
  return (
    <nav
      className="grid grid-cols-4 border-t bg-panel pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegação"
      data-testid="bottom-nav"
    >
      {items.map((it) => (
        <button
          key={it.id}
          className={cn(
            'grid h-[60px] place-items-center pt-1 text-[11px] font-bold tracking-[0.06em] text-faint uppercase',
            it.on && 'text-strong shadow-[inset_0_3px_0_var(--vy-strong)]',
          )}
          onClick={it.act}
          aria-current={it.on ? 'page' : undefined}
          data-testid={`bottom-${it.id}`}
        >
          {it.label}
        </button>
      ))}
    </nav>
  )
}
