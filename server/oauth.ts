// Lógica da function OAuth do Voyager (VO-DEC007): troca o código pelo token e revoga o token.
// O client secret só existe aqui, lido de variável de ambiente do servidor; nunca vai ao navegador.

export interface OAuthEnv {
  GITHUB_CLIENT_ID?: string
  GITHUB_CLIENT_SECRET?: string
}

type Fetch = typeof fetch

const JSON_HEADERS = { 'content-type': 'application/json', 'cache-control': 'no-store' }

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS })
}

function credentials(env: OAuthEnv) {
  const id = env.GITHUB_CLIENT_ID
  const secret = env.GITHUB_CLIENT_SECRET
  if (!id || !secret) return null
  return { id, secret }
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json()
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/** POST { code, redirect_uri } → { access_token, scope } */
export async function exchangeCode(
  request: Request,
  env: OAuthEnv,
  fetchImpl: Fetch = fetch,
): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' })
  const creds = credentials(env)
  if (!creds) return json(500, { error: 'oauth_not_configured' })
  const body = await readJson(request)
  const code = body?.code
  const redirectUri = body?.redirect_uri
  if (typeof code !== 'string' || !code || code.length > 200) {
    return json(400, { error: 'invalid_code' })
  }
  if (redirectUri !== undefined && typeof redirectUri !== 'string') {
    return json(400, { error: 'invalid_redirect_uri' })
  }

  const res = await fetchImpl('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: creds.id,
      client_secret: creds.secret,
      code,
      ...(redirectUri ? { redirect_uri: redirectUri } : {}),
    }),
  })
  if (!res.ok) return json(502, { error: 'github_unavailable' })
  const data = (await res.json()) as Record<string, unknown>
  if (typeof data.access_token !== 'string') {
    return json(400, {
      error: typeof data.error === 'string' ? data.error : 'exchange_failed',
      error_description:
        typeof data.error_description === 'string' ? data.error_description : undefined,
    })
  }
  return json(200, { access_token: data.access_token, scope: data.scope ?? '' })
}

/** POST { access_token } → 204. Revoga o token no GitHub (R14). */
export async function revokeToken(
  request: Request,
  env: OAuthEnv,
  fetchImpl: Fetch = fetch,
): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' })
  const creds = credentials(env)
  if (!creds) return json(500, { error: 'oauth_not_configured' })
  const body = await readJson(request)
  const token = body?.access_token
  if (typeof token !== 'string' || !token || token.length > 400) {
    return json(400, { error: 'invalid_token' })
  }
  const basic = btoa(`${creds.id}:${creds.secret}`)
  const res = await fetchImpl(`https://api.github.com/applications/${creds.id}/token`, {
    method: 'DELETE',
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Basic ${basic}`,
      'content-type': 'application/json',
      'x-github-api-version': '2022-11-28',
    },
    body: JSON.stringify({ access_token: token }),
  })
  // 404: o token já não vale (revogado ou expirado); para quem sai, o efeito é o mesmo.
  if (res.status === 204 || res.status === 404) return new Response(null, { status: 204 })
  return json(502, { error: 'revoke_failed', status: res.status })
}
