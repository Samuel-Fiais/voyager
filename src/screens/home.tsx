import { useState } from 'react'
import { useSession } from '@/auth/session-context'
import { Brand } from '@/components/brand'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserMenu } from '@/components/user-menu'
import { AddWorkspace } from '@/workspace/add-workspace'
import { VaultProvider } from '@/vault/vault-context'
import { useWorkspace, WorkspaceProvider } from '@/workspace/workspace-context'
import { NavProvider } from '@/shell/nav'
import { AppShell } from '@/shell/app-shell'
import { Login } from './login'

export function Home() {
  const { session } = useSession()
  if (!session) return <Login />
  return (
    <WorkspaceProvider>
      <VaultProvider>
        <Shell />
      </VaultProvider>
    </WorkspaceProvider>
  )
}

function Shell() {
  const { active, loaded } = useWorkspace()
  const [adding, setAdding] = useState(false)
  if (!loaded) return null
  if (active && !adding) {
    return (
      <NavProvider>
        <AppShell onAddWorkspace={() => setAdding(true)} />
      </NavProvider>
    )
  }
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-12 items-center justify-between gap-2 border-b bg-panel px-3 sm:px-4">
        <Brand />
        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>
      <AddWorkspace
        onCancel={active ? () => setAdding(false) : undefined}
        onDone={() => setAdding(false)}
      />
    </div>
  )
}
