import type { IncomingMessage, ServerResponse } from 'node:http'
import { loadEnv, type Plugin } from 'vite'
import { exchangeCode, revokeToken, type OAuthEnv } from './oauth.js'

// Serve as functions de /api/auth no servidor do Vite (desenvolvimento e preview),
// com as variáveis de .env.local, sem depender da Vercel CLI.
const ROUTES: Record<string, typeof exchangeCode> = {
  '/api/auth/token': exchangeCode,
  '/api/auth/revoke': revokeToken,
}

async function toRequest(req: IncomingMessage): Promise<Request> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const body = chunks.length ? Buffer.concat(chunks) : undefined
  return new Request(`http://localhost${req.url}`, {
    method: req.method,
    headers: { 'content-type': req.headers['content-type'] ?? 'application/json' },
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
  })
}

async function send(res: ServerResponse, response: Response) {
  res.statusCode = response.status
  response.headers.forEach((value, key) => res.setHeader(key, value))
  res.end(Buffer.from(await response.arrayBuffer()))
}

function pick(env: NodeJS.ProcessEnv): OAuthEnv {
  const out: OAuthEnv = {}
  if (env.GITHUB_CLIENT_ID) out.GITHUB_CLIENT_ID = env.GITHUB_CLIENT_ID
  if (env.GITHUB_CLIENT_SECRET) out.GITHUB_CLIENT_SECRET = env.GITHUB_CLIENT_SECRET
  return out
}

export function devApi(): Plugin {
  let mode = 'development'
  let envDir = process.cwd()
  const middleware = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const handler = ROUTES[(req.url ?? '').split('?')[0]]
    if (!handler) return next()
    try {
      // Relê o .env.local a cada chamada: colar o secret não exige reiniciar o servidor.
      const env: OAuthEnv = { ...loadEnv(mode, envDir, 'GITHUB_'), ...pick(process.env) }
      await send(res, await handler(await toRequest(req), env))
    } catch {
      res.statusCode = 500
      res.end('{"error":"internal"}')
    }
  }
  return {
    name: 'voyager-dev-api',
    configResolved(config) {
      mode = config.mode
      envDir = config.envDir || process.cwd()
    },
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
