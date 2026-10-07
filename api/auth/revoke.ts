import { revokeToken } from '../../server/oauth.js'

export function POST(request: Request) {
  return revokeToken(request, process.env)
}
