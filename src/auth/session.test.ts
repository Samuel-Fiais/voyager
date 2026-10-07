import { afterEach, describe, expect, it, vi } from 'vitest'
import { authorizeUrl, completeLogin, loadSession, logout, onLogout, SESSION_KEY } from './session'

afterEach(() => vi.unstubAllGlobals())

describe('login', () => {
  it('monta a URL de autorização com escopo repo e state', () => {
    vi.stubEnv('VITE_GITHUB_CLIENT_ID', 'cid')
    const url = new URL(authorizeUrl())
    expect(url.origin + url.pathname).toBe('https://github.com/login/oauth/authorize')
    expect(url.searchParams.get('client_id')).toBe('cid')
    expect(url.searchParams.get('scope')).toBe('repo')
    expect(url.searchParams.get('redirect_uri')).toBe(`${window.location.origin}/auth/callback`)
    expect(url.searchParams.get('state')).toMatch(/^[0-9a-f]{32}$/)
  })

  it('recusa a volta com state diferente', async () => {
    authorizeUrl()
    await expect(completeLogin(new URLSearchParams({ code: 'c', state: 'outro' }))).rejects.toThrow(
      /Estado do login inválido/,
    )
  })

  it('troca o código, lê o usuário e guarda a sessão', async () => {
    const state = new URL(authorizeUrl()).searchParams.get('state')!
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/auth/token')
        return Response.json({ access_token: 'gho_abc', scope: 'repo' })
      if (url === 'https://api.github.com/user')
        return Response.json({
          login: 'samuel',
          name: 'Samuel Fiais',
          avatar_url: 'https://a/x.png',
        })
      return new Response(null, { status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock)
    const session = await completeLogin(new URLSearchParams({ code: 'c', state }))
    expect(session).toEqual({
      token: 'gho_abc',
      login: 'samuel',
      name: 'Samuel Fiais',
      avatarUrl: 'https://a/x.png',
    })
    expect(loadSession()).toEqual(session)
  })
})

describe('logout', () => {
  it('revoga o token, roda as limpezas e apaga a sessão', async () => {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ token: 'gho_abc', login: 's', name: null, avatarUrl: '' }),
    )
    const cleanup = vi.fn()
    onLogout(cleanup)
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    const result = await logout()
    expect(result.revoked).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/revoke',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(cleanup).toHaveBeenCalled()
    expect(localStorage.getItem(SESSION_KEY)).toBeNull()
  })
})
