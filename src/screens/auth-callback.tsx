import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { completeLogin } from '@/auth/session'
import { useSession } from '@/auth/session-context'
import { Login } from './login'

export function AuthCallback() {
  const { setSession } = useSession()
  const navigate = useNavigate()
  const [error, setError] = useState<string>()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    completeLogin(new URLSearchParams(window.location.search))
      .then((session) => {
        setSession(session)
        navigate({ to: '/', replace: true })
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Falha no login.'))
  }, [navigate, setSession])

  if (error) return <Login error={error} />
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <p className="label-caps" role="status">
        Concluindo a entrada…
      </p>
    </div>
  )
}
