import { describe, expect, it } from 'vitest'
import { GitHubClient } from '@/github/client'
import { VoyagerDB, workspaceId, type WorkspaceRecord } from '@/storage/db'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { formatReport, loadRules, validateVault } from '@/vault/validate'
import { buildVaultIndex, countByTypeAndStatus } from '@/vault/vault-index'
import { syncWorkspace } from './sync'

// Medição contra o GitHub real. Só roda com VOYAGER_REAL_TOKEN e VOYAGER_REAL_REPO (owner/repo).
const token = process.env.VOYAGER_REAL_TOKEN
const target = process.env.VOYAGER_REAL_REPO

describe.runIf(token && target)('sincronização real', () => {
  it('sincroniza o vault inteiro e depois só o que mudou', { timeout: 120_000 }, async () => {
    const [owner, repo] = target!.split('/')
    const db = new VoyagerDB('real')
    const ws: WorkspaceRecord = {
      id: workspaceId(owner, repo, 'main'),
      owner,
      repo,
      branch: 'main',
      lastCommit: null,
      lastTree: null,
      lastSyncAt: null,
      syncIntervalMin: 0,
      fileCount: 0,
      createdAt: new Date().toISOString(),
    }
    await db.workspaces.put(ws)
    const gh = new GitHubClient(token!, (...a) => fetch(...a))
    const first = await syncWorkspace(gh, db, ws)
    const second = await syncWorkspace(gh, db, (await db.workspaces.get(ws.id))!)
    const files = await db.files.count()
    console.log(
      JSON.stringify({
        first: { ...first, durationMs: Math.round(first.durationMs) },
        second: { ...second, durationMs: Math.round(second.durationMs) },
        files,
      }),
    )
    expect(first.added).toBe(files)
    expect(second.added + second.modified + second.removed).toBe(0)

    // Índice montado da cópia sincronizada × validar-vault.py no clone local (mesmo commit).
    const kb = process.env.VOYAGER_KB_DIR
    if (kb) {
      const records = await db.files.where('workspaceId').equals(ws.id).toArray()
      const files = new Map(
        records.map((r) => [r.path.normalize('NFC'), r.kind === 'text' ? r.text! : null]),
      )
      const rules = loadRules(files)
      const result = validateVault(files, rules)
      const py = execFileSync(
        'python3',
        [join(kb, 'Skills/scripts/validar-vault.py'), '--report'],
        { encoding: 'utf8' },
      )
      expect(formatReport(result, rules)).toBe(py.split(/\n\n(?=\d+ erro)/)[0].trim())
      expect(countByTypeAndStatus(buildVaultIndex(files))).toEqual(result.report)
      console.log(
        JSON.stringify({ paridade: 'ok', notas: result.notes, erros: result.errors.length }),
      )
    }
  })
})
