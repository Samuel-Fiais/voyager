import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useSession } from '@/auth/session-context'
import { Button } from '@/components/ui/button'

export function UserMenu() {
  const { session, logout } = useSession()
  const navigate = useNavigate()
  const [leaving, setLeaving] = useState(false)
  if (!session) return null

  async function leave() {
    setLeaving(true)
    await logout()
    setLeaving(false)
    navigate({ to: '/' })
  }

  return (
    <div className="flex items-center gap-2">
      <img src={session.avatarUrl} alt="" className="size-6 border" referrerPolicy="no-referrer" />
      <span className="hidden text-label text-faint sm:inline" data-testid="user-login">
        {session.login}
      </span>
      <Button variant="ghost" onClick={leave} disabled={leaving} data-testid="logout">
        {leaving ? 'Saindo…' : 'Sair'}
      </Button>
    </div>
  )
}
