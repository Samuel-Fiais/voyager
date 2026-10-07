import { beforeEach, describe, expect, it } from 'vitest'
import { GitHubClient } from '@/github/client'
import {
  clearAll,
  removeWorkspace,
  VoyagerDB,
  workspaceId,
  type WorkspaceRecord,
} from '@/storage/db'
import { FakeGitHub } from '../../testing/fake-github'
import { loadFixtureVault } from '../../testing/fixture-vault'
import { syncWorkspace, SyncError } from './sync'

let db: VoyagerDB
let n = 0

async function setup(branches = ['main']) {
  const gh = await FakeGitHub.create(loadFixtureVault(), { branches })
  const client = new GitHubClient(gh.token, gh.fetch)
  return { gh, client }
}

async function addWorkspace(branch = 'main'): Promise<WorkspaceRecord> {
  const ws: WorkspaceRecord = {
    id: workspaceId('samuel-teste', 'vault-sintetico', branch),
    owner: 'samuel-teste',
    repo: 'vault-sintetico',
    branch,
    lastCommit: null,
    lastTree: null,
    lastSyncAt: null,
    syncIntervalMin: 10,
    fileCount: 0,
    createdAt: new Date().toISOString(),
  }
  await db.workspaces.put(ws)
  return ws
}

beforeEach(() => {
  db = new VoyagerDB(`teste-${n++}`)
})

describe('syncWorkspace', () => {
  it('faz a primeira sincronização completa, sem .obsidian e .trash', async () => {
    const { gh, client } = await setup()
    const ws = await addWorkspace()
    const result = await syncWorkspace(client, db, ws)
    const files = await db.files.where('workspaceId').equals(ws.id).toArray()
    const paths = files.map((f) => f.path)
    expect(result.from).toBeNull()
    expect(result.to).toBe(gh.head().sha)
    expect(result.added).toBe(files.length)
    expect(paths.some((p) => p.startsWith('.obsidian/') || p.startsWith('.trash/'))).toBe(false)
    expect(paths).toContain('Clientes/C001 - Acme.md')
    const png = files.find((f) => f.path.endsWith('login.png'))!
    expect(png.kind).toBe('binary')
    expect(png.data?.size).toBeGreaterThan(0)
    const demand = files.find((f) => f.path.startsWith('Demandas/Acme/AC-D001'))!
    expect(demand.kind).toBe('text')
    expect(demand.text).toContain('Portal de pedidos')
    expect((await db.workspaces.get(ws.id))!.lastCommit).toBe(gh.head().sha)
    // textos chegam pelo GraphQL em lote; só os binários vão à API de blobs
    expect(gh.calls.filter((c) => c === 'POST /graphql').length).toBe(1)
    expect(gh.calls.filter((c) => c.includes('/git/blobs/')).length).toBe(1)
  })

  it('na sincronização seguinte baixa só o que mudou e apaga o removido', async () => {
    const { gh, client } = await setup()
    const ws = await addWorkspace()
    await syncWorkspace(client, db, ws)
    gh.calls.length = 0

    const same = await syncWorkspace(client, db, (await db.workspaces.get(ws.id))!)
    expect(same).toMatchObject({ added: 0, modified: 0, removed: 0 })
    expect(gh.calls).toEqual([`GET /repos/samuel-teste/vault-sintetico/branches/main`])

    await gh.externalCommit(
      {
        'Demandas/Acme/AC-D002 - Relatório de vendas.md':
          '---\ncode: "AC-D002"\n---\nalterada por um agente\n',
        'Demandas/Acme/AC-D003 - Nova.md': 'nova',
        'README.md': null,
      },
      'commit de agente',
    )
    gh.calls.length = 0
    const next = await syncWorkspace(client, db, (await db.workspaces.get(ws.id))!)
    expect(next).toMatchObject({ added: 1, modified: 1, removed: 1 })
    expect(next.to).toBe(gh.head().sha)
    const changed = await db.files.get([ws.id, 'Demandas/Acme/AC-D002 - Relatório de vendas.md'])
    expect(changed!.text).toContain('alterada por um agente')
    expect(await db.files.get([ws.id, 'README.md'])).toBeUndefined()
    expect(gh.calls.filter((c) => c.includes('/git/blobs/'))).toEqual([])
  })

  it('mantém a cópia de outro workspace e apaga tudo ao sair', async () => {
    const { client } = await setup(['main', 'rascunho'])
    const a = await addWorkspace('main')
    const b = await addWorkspace('rascunho')
    await syncWorkspace(client, db, a)
    await syncWorkspace(client, db, b)
    const countA = await db.files.where('workspaceId').equals(a.id).count()
    await removeWorkspace(db, b.id)
    expect(await db.files.where('workspaceId').equals(a.id).count()).toBe(countA)
    expect(await db.files.where('workspaceId').equals(b.id).count()).toBe(0)
    await clearAll(db)
    expect(await db.files.count()).toBe(0)
    expect(await db.workspaces.count()).toBe(0)
  })

  it('classifica erros de acesso e de branch inexistente', async () => {
    const { gh } = await setup()
    const ws = await addWorkspace()
    const bad = new GitHubClient('gho_outro', gh.fetch)
    await expect(syncWorkspace(bad, db, ws)).rejects.toMatchObject({ kind: 'access' })
    const missing = await addWorkspace('nao-existe')
    const err = await syncWorkspace(new GitHubClient(gh.token, gh.fetch), db, missing).catch(
      (e) => e,
    )
    expect(err).toBeInstanceOf(SyncError)
    expect(err.kind).toBe('not_found')
  })
})
