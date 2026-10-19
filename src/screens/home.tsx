import { useState } from 'react'
import { useSession } from '@/auth/session-context'
import { Brand } from '@/components/brand'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserMenu } from '@/components/user-menu'
import { AddWorkspace } from '@/workspace/add-workspace'
import { SyncControl } from '@/workspace/sync-control'
import { useWorkspace, WorkspaceProvider } from '@/workspace/workspace-context'
import { WorkspaceSwitcher } from '@/workspace/workspace-switcher'
import { WorkspaceSummary } from '@/workspace/workspace-summary'
import { Login } from './login'

export function Home() {
  const { session } = useSession()
  if (!session) return <Login />
  return (
    <WorkspaceProvider>
      <Shell />
    </WorkspaceProvider>
  )
}

function Shell() {
  const { active, loaded } = useWorkspace()
  const [adding, setAdding] = useState(false)
  const showAdd = loaded && (!active || adding)
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-12 items-center justify-between gap-2 border-b bg-panel px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Brand />
          {!showAdd && <WorkspaceSwitcher onAdd={() => setAdding(true)} />}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {!showAdd && <SyncControl />}
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>
      {showAdd ? (
        <AddWorkspace
          onCancel={active ? () => setAdding(false) : undefined}
          onDone={() => setAdding(false)}
        />
      ) : (
        active && <WorkspaceSummary key={active.id} />
      )}
    </div>
  )
}
