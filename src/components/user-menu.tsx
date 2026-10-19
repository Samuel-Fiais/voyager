import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useSession } from '@/auth/session-context'
import { useTheme } from '@/theme/use-theme'

export function UserMenu() {
  const { session, logout } = useSession()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  if (!session) return null
  const initials = (session.name ?? session.login)
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  async function leave() {
    setLeaving(true)
    await logout()
    setLeaving(false)
    setOpen(false)
    navigate({ to: '/', search: {} })
  }

  return (
    <div className="relative" ref={ref}>
      <button
        className="grid size-[30px] place-items-center overflow-hidden bg-strong text-[11px] font-extrabold text-bg"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Conta ${session.login}`}
        title={session.name ?? session.login}
        data-testid="user-menu"
      >
        {session.avatarUrl ? (
          <img
            src={session.avatarUrl}
            alt=""
            className="size-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          initials
        )}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-40 mt-1 w-56 border bg-elevated py-1 shadow-layer"
        >
          <p className="px-3 pt-2 pb-1 label-caps">Conta</p>
          <p className="truncate px-3 pb-2 text-strong" data-testid="user-login">
            {session.login}
          </p>
          <button
            role="menuitem"
            className="w-full border-t px-3 py-2 text-left hover:bg-panel"
            onClick={toggle}
          >
            {theme === 'dark' ? 'Usar tema claro ☀' : 'Usar tema escuro ☾'}
          </button>
          <button
            role="menuitem"
            className="w-full border-t px-3 py-2 text-left hover:bg-panel"
            onClick={() => void leave()}
            disabled={leaving}
            data-testid="logout"
          >
            {leaving ? 'Saindo…' : 'Sair e apagar a cópia local'}
          </button>
        </div>
      )}
    </div>
  )
}
