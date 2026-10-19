import { Brand } from '@/components/brand'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserMenu } from '@/components/user-menu'
import { SyncControl } from '@/workspace/sync-control'
import { WorkspaceSwitcher } from '@/workspace/workspace-switcher'
import { useState } from 'react'
import { NewNoteDialog } from '@/editor/new-note-dialog'
import { useNav } from './nav'

export function TopBar({ onAddWorkspace }: { onAddWorkspace: () => void }) {
  const { setSidebarOpen, sidebarOpen, setPaletteOpen } = useNav()
  const [creating, setCreating] = useState(false)
  return (
    <header className="flex h-[52px] min-w-0 items-center gap-2 border-b bg-panel px-2.5 md:gap-3.5 md:px-4">
      <button
        className="grid size-8 shrink-0 place-items-center border text-sm hover:bg-elevated min-[780px]:hidden"
        aria-label="Abrir navegação"
        aria-expanded={sidebarOpen}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        data-testid="menu-button"
      >
        ☰
      </button>
      <span className="hidden sm:block">
        <Brand />
      </span>
      <WorkspaceSwitcher onAdd={onAddWorkspace} />
      <button
        className="flex shrink-0 items-center gap-2.5 border px-2.5 py-[7px] text-left text-[13px] text-faint hover:border-faint md:max-w-[420px] md:min-w-0 md:flex-1 md:shrink"
        onClick={() => setPaletteOpen(true)}
        aria-label="Buscar"
        data-testid="search-button"
      >
        ⌕<span className="hidden truncate md:inline">Buscar nota ou ir para um código</span>
        <kbd className="ml-auto hidden border px-1.5 font-mono text-[10.5px] text-secondary md:inline">
          ⌘K
        </kbd>
      </button>
      <button
        className="flex shrink-0 items-center gap-1.5 border px-2.5 py-[7px] text-[13px] text-secondary hover:border-faint hover:text-strong"
        onClick={() => setCreating(true)}
        aria-label="Nova nota"
        data-testid="new-note-button"
      >
        +<span className="hidden lg:inline">Nova</span>
      </button>
      {creating && <NewNoteDialog onClose={() => setCreating(false)} />}
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <SyncControl />
        <span className="hidden sm:block">
          <ThemeToggle />
        </span>
        <UserMenu />
      </div>
    </header>
  )
}
