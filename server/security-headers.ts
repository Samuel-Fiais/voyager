// Cabeçalhos de segurança do Voyager (VO-T012). Os mesmos valores estão em vercel.json
// (produção) e no preview do Vite (testes ponta a ponta rodam sob a mesma política).

export const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  // React (atributo style) e o SVG do Mermaid usam estilos em linha
  "style-src 'self' 'unsafe-inline'",
  // anexos da cópia local (blob:), avatar do GitHub e imagens externas citadas nas notas
  "img-src 'self' blob: data: https:",
  "font-src 'self' data:",
  // só a API do GitHub e a function /api/auth (mesma origem)
  "connect-src 'self' https://api.github.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ')

export const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': CSP,
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
}
