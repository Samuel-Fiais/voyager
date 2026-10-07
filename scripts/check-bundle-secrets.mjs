// Garante que o client secret não vai para o bundle: compila com um valor sentinela e procura em dist/.
import { execSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const SENTINEL = 'sentinela-do-secret-nao-pode-vazar'
execSync('npx vite build --logLevel error', {
  stdio: 'inherit',
  env: { ...process.env, GITHUB_CLIENT_SECRET: SENTINEL, VITE_GITHUB_CLIENT_ID: 'check-client' },
})
const leaks = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else {
      const text = readFileSync(p, 'latin1')
      if (text.includes(SENTINEL) || text.includes('GITHUB_CLIENT_SECRET')) leaks.push(p)
    }
  }
}
walk('dist')
if (leaks.length) {
  console.error('Secret encontrado no bundle:', leaks)
  process.exit(1)
}
console.log('check-bundle-secrets: ok (nenhum secret no bundle)')
