import { useState } from 'react'
import { useSession } from '@/auth/session-context'
import { Brand } from '@/components/brand'
import { ThemeToggle } from '@/components/theme-toggle'
import { UserMenu } from '@/components/user-menu'
import type { GitHubRepo } from '@/github/client'
import { Login } from './login'
import { RepoPicker } from './repo-picker'

export function Home() {
  const { session } = useSession()
  const [picked, setPicked] = useState<GitHubRepo | null>(null)
  if (!session) return <Login />
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-12 items-center justify-between border-b bg-panel px-4">
        <Brand />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>
      {picked ? (
        <section className="mx-auto w-full max-w-2xl px-4 py-10">
          <div className="pt-4 rule-record">
            <p className="label-caps">Workspace</p>
            <p className="mt-3 font-mono text-title text-strong" data-testid="picked-repo">
              {picked.full_name}
            </p>
          </div>
        </section>
      ) : (
        <RepoPicker onPick={setPicked} />
      )}
    </div>
  )
}
