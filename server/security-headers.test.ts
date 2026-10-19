import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { SECURITY_HEADERS } from './security-headers'

describe('cabeçalhos de segurança', () => {
  it('vercel.json (produção) usa os mesmos cabeçalhos do preview', () => {
    const vercel = JSON.parse(
      readFileSync(join(import.meta.dirname, '..', 'vercel.json'), 'utf8'),
    ) as {
      headers: { source: string; headers: { key: string; value: string }[] }[]
    }
    const all = vercel.headers.find((h) => h.source === '/(.*)')!
    expect(Object.fromEntries(all.headers.map((h) => [h.key, h.value]))).toEqual(SECURITY_HEADERS)
  })

  it('a CSP só permite scripts do próprio app e conexões com a API do GitHub', () => {
    const csp = SECURITY_HEADERS['Content-Security-Policy']
    expect(csp).toContain("script-src 'self'")
    expect(csp).not.toMatch(/script-src[^;]*unsafe/)
    expect(csp).toContain("connect-src 'self' https://api.github.com")
    expect(csp).toContain("frame-ancestors 'none'")
  })
})
