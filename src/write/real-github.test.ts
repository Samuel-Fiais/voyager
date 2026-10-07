import { describe, expect, it } from 'vitest'
import { GitHubClient } from '@/github/client'
import { branchHead } from '@/github/repo'
import { VoyagerDB, workspaceId, type WorkspaceRecord } from '@/storage/db'
import { syncWorkspace } from '@/sync/sync'
import { buildVaultIndex } from '@/vault/vault-index'
import { commitChanges, ConflictError } from './commit'
import { planStatusChange } from './plan'

// Integração com o GitHub real (repositório de teste). Só roda com
// VOYAGER_REAL_TOKEN e VOYAGER_TEST_REPO=owner/repo (ex.: Samuel-Fiais/voyager-vault-teste).
const token = process.env.VOYAGER_REAL_TOKEN
const target = process.env.VOYAGER_TEST_REPO

describe.runIf(token && target)('motor de escrita no GitHub real', () => {
  const [owner, repo] = (target ?? '/').split('/')
  const gh = new GitHubClient(token!, (...a) => fetch(...a))
  const db = new VoyagerDB('real-write')
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

  async function fresh() {
    await syncWorkspace(gh, db, (await db.workspaces.get(ws.id)) ?? ws)
    const w = (await db.workspaces.get(ws.id))!
    const records = await db.files.where('workspaceId').equals(ws.id).toArray()
    const index = buildVaultIndex(
      new Map(records.map((r) => [r.path, r.kind === 'text' ? r.text! : null])),
    )
    return { w, index }
  }

  /** Commit externo pela API de conteúdos (simula um agente). */
  async function externalEdit(path: string, edit: (text: string) => string) {
    const file = await gh.request<{ sha: string; content: string }>(
      `/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`,
    )
    const text = new TextDecoder().decode(
      Uint8Array.from(atob(file.content.replace(/\n/g, '')), (c) => c.charCodeAt(0)),
    )
    const bytes = new TextEncoder().encode(edit(text))
    let bin = ''
    bytes.forEach((b) => (bin += String.fromCharCode(b)))
    await gh.request(
      `/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          message: 'commit externo de teste (agente simulado)',
          content: btoa(bin),
          sha: file.sha,
        }),
      },
    )
  }

  it(
    'status gera exatamente um commit; concorrente em outro arquivo é reaplicado; no mesmo arquivo dá conflito',
    { timeout: 120_000 },
    async () => {
      await db.workspaces.put(ws)
      let { w, index } = await fresh()
      const task = index.byCode.get('AC-T005')!
      const to = task.status === 'planned' ? 'ready' : 'planned'
      const plan = planStatusChange({
        index,
        note: task,
        to,
        reason: `teste de integração ${new Date().toISOString()}`,
        actor: 'Samuel Fiais',
      })
      expect(plan.errors).toEqual([])
      const first = await commitChanges(gh, w, plan.changes, plan.message)
      const head1 = await branchHead(gh, { owner, repo }, 'main')
      expect(head1.commit).toBe(first.commit)
      expect(first.parent).toBe(w.lastCommit)
      console.log(JSON.stringify({ commit: first.commit, mensagem: plan.message }))

      // Concorrência em outro arquivo: o Voyager parte do commit antigo e reaplica sobre a ponta.
      ;({ w, index } = await fresh())
      const t6 = index.byCode.get('AC-T006')!
      const plan2 = planStatusChange({
        index,
        note: t6,
        to: t6.status === 'ready' ? 'planned' : 'ready',
        reason: 'concorrência',
        actor: 'Samuel Fiais',
      })
      await externalEdit('README.md', (t) => `${t.trimEnd()}\n\nlinha externa ${Date.now()}\n`)
      const second = await commitChanges(gh, w, plan2.changes, plan2.message)
      expect(second.rebased).toBe(true)

      // Conflito: o mesmo arquivo mudou na branch.
      ;({ w, index } = await fresh())
      const t5 = index.byCode.get('AC-T005')!
      const plan3 = planStatusChange({
        index,
        note: t5,
        to: t5.status === 'planned' ? 'ready' : 'planned',
        reason: 'conflito',
        actor: 'Samuel Fiais',
      })
      await externalEdit(t5.path, (t) =>
        t.replace(/\n## Auditoria/, `\nEditado por um agente ${Date.now()}.\n\n## Auditoria`),
      )
      const before = await branchHead(gh, { owner, repo }, 'main')
      await expect(commitChanges(gh, w, plan3.changes, plan3.message)).rejects.toBeInstanceOf(
        ConflictError,
      )
      expect((await branchHead(gh, { owner, repo }, 'main')).commit).toBe(before.commit)
    },
  )
})
