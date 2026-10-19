import { describe, expect, it, vi } from 'vitest'
import { exchangeCode, revokeToken } from './oauth.js'

const env = { GITHUB_CLIENT_ID: 'cid', GITHUB_CLIENT_SECRET: 'segredo-super' }

function post(body: unknown) {
  return new Request('http://localhost/api', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('exchangeCode', () => {
  it('troca o código pelo token sem devolver o secret', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ access_token: 'gho_abc', scope: 'repo', token_type: 'bearer' }),
    )
    const res = await exchangeCode(
      post({ code: 'c0d3', redirect_uri: 'https://x/auth/callback' }),
      env,
      fetchMock,
    )
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(JSON.parse(text)).toEqual({ access_token: 'gho_abc', scope: 'repo' })
    expect(text).not.toContain('segredo-super')
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://github.com/login/oauth/access_token')
    expect(JSON.parse(String(init.body))).toMatchObject({
      client_id: 'cid',
      client_secret: 'segredo-super',
      code: 'c0d3',
      redirect_uri: 'https://x/auth/callback',
    })
  })

  it('repassa o erro do GitHub (código expirado)', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({ error: 'bad_verification_code', error_description: 'expirado' }),
    )
    const res = await exchangeCode(post({ code: 'velho' }), env, fetchMock)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: 'bad_verification_code',
      error_description: 'expirado',
    })
  })

  it('recusa corpo sem código, método errado e falta de configuração', async () => {
    const fetchMock = vi.fn()
    expect((await exchangeCode(post({}), env, fetchMock)).status).toBe(400)
    expect(
      (await exchangeCode(new Request('http://x', { method: 'GET' }), env, fetchMock)).status,
    ).toBe(405)
    expect((await exchangeCode(post({ code: 'a' }), {}, fetchMock)).status).toBe(500)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('revokeToken', () => {
  it('revoga o token com autenticação básica do app', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }))
    const res = await revokeToken(post({ access_token: 'gho_abc' }), env, fetchMock)
    expect(res.status).toBe(204)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api.github.com/applications/cid/token')
    expect(init.method).toBe('DELETE')
    expect((init.headers as Record<string, string>).authorization).toBe(
      `Basic ${btoa('cid:segredo-super')}`,
    )
    expect(JSON.parse(String(init.body))).toEqual({ access_token: 'gho_abc' })
  })

  it('trata token já inválido (404) como revogado', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 404 }))
    expect((await revokeToken(post({ access_token: 'gho_x' }), env, fetchMock)).status).toBe(204)
  })

  it('falha quando o GitHub recusa a revogação', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 422 }))
    expect((await revokeToken(post({ access_token: 'gho_x' }), env, fetchMock)).status).toBe(502)
  })
})
