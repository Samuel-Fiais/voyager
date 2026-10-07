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

export function devApi(): Plugin {
  let env: OAuthEnv = {}
  const middleware = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const handler = ROUTES[(req.url ?? '').split('?')[0]]
    if (!handler) return next()
    try {
      await send(res, await handler(await toRequest(req), env))
    } catch {
      res.statusCode = 500
      res.end('{"error":"internal"}')
    }
  }
  return {
    name: 'voyager-dev-api',
    configResolved(config) {
      env = loadEnv(config.mode, config.envDir || process.cwd(), 'GITHUB_')
    },
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}
