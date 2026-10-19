import { GitHubError, type GitHubClient } from '@/github/client'
import { branchHead, readBlob, readTexts, readTree, runPool } from '@/github/repo'
import type { FileRecord, VoyagerDB, WorkspaceRecord } from '@/storage/db'
import { diffTree, type TreeEntry } from './diff'
import { isIgnored, isTextPath } from './paths'

// Sincronização do workspace (VO-DEC003, VO-DEC008): só lê o repositório (R03).

export interface SyncProgress {
  phase: 'head' | 'tree' | 'texts' | 'binaries' | 'saving'
  done: number
  total: number
}

export interface SyncResult {
  from: string | null
  to: string
  added: number
  modified: number
  removed: number
  unchanged: number
  durationMs: number
}

export type SyncErrorKind = 'network' | 'access' | 'rate_limit' | 'not_found' | 'unknown'

export class SyncError extends Error {
  readonly kind: SyncErrorKind
  constructor(kind: SyncErrorKind, message: string) {
    super(message)
    this.name = 'SyncError'
    this.kind = kind
  }
}

export function classifyError(error: unknown): SyncError {
  if (error instanceof SyncError) return error
  if (error instanceof GitHubError) {
    if (error.rateLimited)
      return new SyncError('rate_limit', 'Limite da API do GitHub atingido. Tente mais tarde.')
    if (error.status === 401)
      return new SyncError('access', 'Sessão do GitHub inválida. Entre de novo.')
    if (error.status === 403) return new SyncError('access', 'Sem acesso ao repositório.')
    if (error.status === 404)
      return new SyncError('not_found', 'Repositório ou branch não encontrado.')
    return new SyncError('unknown', `GitHub respondeu ${error.status}: ${error.message}`)
  }
  if (error instanceof TypeError) return new SyncError('network', 'Sem conexão com o GitHub.')
  return new SyncError('unknown', error instanceof Error ? error.message : String(error))
}

export async function syncWorkspace(
  gh: GitHubClient,
  database: VoyagerDB,
  workspace: WorkspaceRecord,
  onProgress?: (p: SyncProgress) => void,
): Promise<SyncResult> {
  const started = performance.now()
  const ref = { owner: workspace.owner, repo: workspace.repo }
  try {
    onProgress?.({ phase: 'head', done: 0, total: 1 })
    const head = await branchHead(gh, ref, workspace.branch)
    if (head.commit === workspace.lastCommit) {
      const now = new Date().toISOString()
      await database.workspaces.update(workspace.id, { lastSyncAt: now })
      return {
        from: workspace.lastCommit,
        to: head.commit,
        added: 0,
        modified: 0,
        removed: 0,
        unchanged: workspace.fileCount,
        durationMs: performance.now() - started,
      }
    }

    onProgress?.({ phase: 'tree', done: 0, total: 1 })
    const remote = (await readTree(gh, ref, head.tree)).filter((e) => !isIgnored(e.path))
    const localEntries = await database.files.where('workspaceId').equals(workspace.id).toArray()
    const local = new Map(localEntries.map((f) => [f.path, f.sha]))
    const diff = diffTree(local, remote)
    const changed = [...diff.added, ...diff.modified]

    const texts = changed.filter((e) => isTextPath(e.path))
    const binaries = changed.filter((e) => !isTextPath(e.path))
    const records: FileRecord[] = []

    onProgress?.({ phase: 'texts', done: 0, total: texts.length })
    const contents = await readTexts(gh, ref, [...new Set(texts.map((e) => e.sha))], (done) =>
      onProgress?.({ phase: 'texts', done, total: texts.length }),
    )
    for (const entry of texts) {
      const text = contents.get(entry.sha)
      if (text == null) binaries.push(entry)
      else records.push(textRecord(workspace.id, entry, text))
    }

    let downloaded = 0
    onProgress?.({ phase: 'binaries', done: 0, total: binaries.length })
    await runPool(binaries, 8, async (entry) => {
      const data = await readBlob(gh, ref, entry.sha)
      if (isTextPath(entry.path)) {
        // texto que o GraphQL não devolveu (truncado): grava como texto mesmo assim
        records.push(textRecord(workspace.id, entry, await data.text()))
      } else {
        records.push({
          workspaceId: workspace.id,
          path: entry.path,
          sha: entry.sha,
          size: entry.size,
          kind: 'binary',
          data,
        })
      }
      onProgress?.({ phase: 'binaries', done: ++downloaded, total: binaries.length })
    })

    onProgress?.({ phase: 'saving', done: 0, total: 1 })
    await database.transaction('rw', database.workspaces, database.files, async () => {
      if (diff.removed.length) {
        await database.files.bulkDelete(
          diff.removed.map((p) => [workspace.id, p] as [string, string]),
        )
      }
      if (records.length) await database.files.bulkPut(records)
      await database.workspaces.update(workspace.id, {
        lastCommit: head.commit,
        lastTree: head.tree,
        lastSyncAt: new Date().toISOString(),
        fileCount: remote.length,
      })
    })

    return {
      from: workspace.lastCommit,
      to: head.commit,
      added: diff.added.length,
      modified: diff.modified.length,
      removed: diff.removed.length,
      unchanged: diff.unchanged,
      durationMs: performance.now() - started,
    }
  } catch (error) {
    throw classifyError(error)
  }
}

function textRecord(workspaceId: string, entry: TreeEntry, text: string): FileRecord {
  return { workspaceId, path: entry.path, sha: entry.sha, size: entry.size, kind: 'text', text }
}
