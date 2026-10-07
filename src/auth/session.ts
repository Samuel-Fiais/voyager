import { GitHubClient, type GitHubUser } from '@/github/client'

// Sessão do Voyager: o token do OAuth App fica no armazenamento local do navegador (VO-DEC007).
// O client secret nunca chega aqui: a troca e a revogação passam pela function /api/auth.

export const SESSION_KEY = 'voyager.session'
const STATE_KEY = 'voyager.oauth.state'

export interface Session {
  token: string
  login: string
  name: string | null
  avatarUrl: string
}

export function clientId(): string {
  return import.meta.env.VITE_GITHUB_CLIENT_ID ?? ''
}

export function redirectUri(): string {
  return `${window.location.origin}/auth/callback`
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Session
    return typeof s.token === 'string' && typeof s.login === 'string' ? s : null
  } catch {
    return null
  }
}

function saveSession(session: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function randomState(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** URL de autorização do GitHub, com escopo `repo` e `state` contra CSRF. */
export function authorizeUrl(): string {
  const state = randomState()
  sessionStorage.setItem(STATE_KEY, state)
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(),
    scope: 'repo',
    state,
    allow_signup: 'false',
  })
  return `https://github.com/login/oauth/authorize?${params}`
}

export class LoginError extends Error {}

/** Conclui o login na volta do GitHub: confere o state, troca o código pelo token e lê o usuário. */
export async function completeLogin(params: URLSearchParams): Promise<Session> {
  const error = params.get('error')
  if (error) throw new LoginError(params.get('error_description') ?? error)
  const code = params.get('code')
  const state = params.get('state')
  const expected = sessionStorage.getItem(STATE_KEY)
  sessionStorage.removeItem(STATE_KEY)
  if (!code) throw new LoginError('O GitHub não devolveu o código de autorização.')
  if (!state || state !== expected)
    throw new LoginError('Estado do login inválido. Tente entrar de novo.')

  const res = await fetch('/api/auth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code, redirect_uri: redirectUri() }),
  })
  const data = (await res.json().catch(() => ({}))) as {
    access_token?: string
    error?: string
    error_description?: string
  }
  if (!res.ok || !data.access_token) {
    throw new LoginError(data.error_description ?? data.error ?? 'Não foi possível obter o token.')
  }
  const user: GitHubUser = await new GitHubClient(data.access_token).user()
  const session: Session = {
    token: data.access_token,
    login: user.login,
    name: user.name,
    avatarUrl: user.avatar_url,
  }
  saveSession(session)
  return session
}

type Cleanup = () => Promise<void> | void
const cleanups: Cleanup[] = []

/** Registra uma limpeza executada ao sair (ex.: apagar a cópia local do vault). */
export function onLogout(cleanup: Cleanup) {
  cleanups.push(cleanup)
}

/** Sai: revoga o token no GitHub pela function e apaga sessão e dados locais (R14). */
export async function logout(
  session: Session | null = loadSession(),
): Promise<{ revoked: boolean }> {
  let revoked = false
  if (session) {
    try {
      const res = await fetch('/api/auth/revoke', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ access_token: session.token }),
      })
      revoked = res.ok
    } catch {
      revoked = false
    }
  }
  for (const cleanup of cleanups) {
    try {
      await cleanup()
    } catch {
      // segue limpando o restante
    }
  }
  localStorage.removeItem(SESSION_KEY)
  return { revoked }
}
