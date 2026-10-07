import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = join(import.meta.dirname, '..', 'fixtures', 'vault')

/** Arquivos do vault sintético: texto para .md/.json/.py, bytes para o resto. */
export function loadFixtureVault(root = ROOT): Record<string, string | Uint8Array> {
  const out: Record<string, string | Uint8Array> = {}
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      if (statSync(p).isDirectory()) walk(p)
      else {
        const rel = relative(root, p).split('\\').join('/')
        const buf = readFileSync(p)
        out[rel] = /\.(md|json|py|txt)$/.test(name) ? buf.toString('utf8') : new Uint8Array(buf)
      }
    }
  }
  walk(root)
  return out
}
