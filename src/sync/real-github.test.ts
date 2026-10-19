import { describe, expect, it } from 'vitest'
import { GitHubClient } from '@/github/client'
import { VoyagerDB, workspaceId, type WorkspaceRecord } from '@/storage/db'
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
  })
})
