import { Brand } from '@/components/brand'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserMenu } from '@/components/user-menu'
import { SyncControl } from '@/workspace/sync-control'
import { WorkspaceSwitcher } from '@/workspace/workspace-switcher'
import { lazy, Suspense, useState } from 'react'
import { useNav } from './nav'
import { Icon } from '@/components/icon'

const NewNoteDialog = lazy(() =>
  import('@/editor/new-note-dialog').then((m) => ({ default: m.NewNoteDialog })),
)

export function TopBar({ onAddWorkspace }: { onAddWorkspace: () => void }) {
  const { setSidebarOpen, sidebarOpen, setPaletteOpen } = useNav()
  const [creating, setCreating] = useState(false)
  return (
    <header className="flex h-[52px] min-w-0 items-center gap-2 border-b bg-panel px-2.5 text-ui md:gap-3 md:px-4">
      <button
        className="hidden size-8 shrink-0 place-items-center border hover:bg-elevated"
        aria-label="Abrir navegação"
        aria-expanded={sidebarOpen}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        data-testid="menu-button"
      >
        <Icon name="menu" />
      </button>
      <span className="hidden sm:block">
        <Brand />
      </span>
      <span className="sm:hidden">
        <Brand size={18} />
      </span>
      <WorkspaceSwitcher onAdd={onAddWorkspace} />
      <button
        className="hidden h-8 shrink-0 items-center gap-2.5 border px-2.5 text-left text-ui text-faint hover:border-faint min-[780px]:flex md:max-w-[420px] md:min-w-0 md:flex-1 md:shrink"
        onClick={() => setPaletteOpen(true)}
        aria-label="Buscar"
        data-testid="search-button"
      >
        <Icon name="search" />
        <span className="hidden truncate md:inline">Buscar nota ou ir para um código</span>
        <kbd className="ml-auto hidden border px-1.5 font-mono text-meta text-secondary md:inline">
          ⌘K
        </kbd>
      </button>
      <button
        className="flex h-8 shrink-0 items-center gap-1.5 border px-2.5 text-ui text-secondary hover:border-faint hover:text-strong"
        onClick={() => setCreating(true)}
        aria-label="Nova nota"
        data-testid="new-note-button"
      >
        <Icon name="plus" />
        <span className="hidden lg:inline">Nova</span>
      </button>
      {creating && (
        <Suspense fallback={null}>
          <NewNoteDialog onClose={() => setCreating(false)} />
        </Suspense>
      )}
      <div className="ml-auto flex shrink-0 items-center gap-2 border-l border-line pl-2 md:gap-2.5 md:pl-3">
        <SyncControl />
        <div className="flex h-8 items-stretch divide-x divide-line border border-line">
          <span className="hidden sm:contents">
            <ThemeToggle className="border-0" />
          </span>
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
