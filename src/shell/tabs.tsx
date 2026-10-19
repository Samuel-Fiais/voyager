import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useVault } from '@/vault/vault-context'
import { useNav } from './nav'
import { navMeta } from './nav-meta'

const short = (s: string, n = 24) => (s.length > n ? `${s.slice(0, n)}…` : s)

export function Tabs() {
  const { tabs, current, open, close } = useNav()
  const { index } = useVault()
  const activeRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    activeRef.current?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  }, [current])
  return (
    <div
      className="flex [scrollbar-width:none] overflow-x-auto overflow-y-hidden border-b bg-panel"
      role="tablist"
      data-testid="tabs"
    >
      {tabs.map((id) => {
        const meta = navMeta(id, index)
        if (!meta) return null
        const on = current === id
        return (
          <div
            key={id}
            ref={on ? activeRef : undefined}
            className={cn(
              'flex shrink-0 items-center gap-2 border-r pr-2 pl-3.5 text-[13px] whitespace-nowrap text-secondary',
              on && 'bg-bg text-strong shadow-[inset_0_3px_0_var(--vy-strong)]',
            )}
          >
            <button
              role="tab"
              aria-selected={on}
              className="flex h-[38px] items-center gap-2"
              onClick={() => open(id)}
            >
              <span className="font-mono text-[11px] text-faint">{meta.code}</span>
              {short(meta.label)}
            </button>
            <button
              className="grid size-5 place-items-center text-[15px] leading-none text-faint hover:bg-elevated hover:text-strong"
              aria-label={`Fechar aba ${meta.label}`}
              onClick={() => close(id)}
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}
