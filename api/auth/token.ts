import { exchangeCode } from '../../server/oauth.js'

export function POST(request: Request) {
  return exchangeCode(request, process.env)
}
