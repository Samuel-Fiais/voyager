import { loadFixtureVault } from './fixture-vault'

/** Converte os arquivos de um vault em mapa caminho → texto (null para binário), sem pastas ignoradas. */
export function toVaultFiles(
  files: Record<string, string | Uint8Array>,
): Map<string, string | null> {
  const out = new Map<string, string | null>()
  for (const [p, c] of Object.entries(files)) {
    if (/^(\.obsidian|\.trash|\.git|node_modules)\//.test(p)) continue
    out.set(p.normalize('NFC'), typeof c === 'string' ? c : null)
  }
  return out
}

export function fixtureFiles() {
  return toVaultFiles(loadFixtureVault())
}
