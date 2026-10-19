import { GitHubError, type GitHubClient } from '@/github/client'
import { branchHead, readTree } from '@/github/repo'
import type { WorkspaceRecord } from '@/storage/db'
import type { FileChange } from './validate-change'

// Commit direto na branch do workspace pela API de dados do Git (R08, VO-DEC004).
// Parte do último commit lido; se a branch avançou sem tocar os mesmos arquivos, reaplica sobre a ponta;
// se tocou, devolve conflito. Nunca usa force.

export class ConflictError extends Error {
  readonly paths: string[]
  readonly head: string
  constructor(paths: string[], head: string) {
    super(
      `A branch avançou e alterou ${paths.length === 1 ? 'o mesmo arquivo' : 'os mesmos arquivos'}: ${paths.join(', ')}`,
    )
    this.name = 'ConflictError'
    this.paths = paths
    this.head = head
  }
}

export interface CommitResult {
  commit: string
  parent: string
  /** a branch tinha avançado e a alteração foi reaplicada sobre a ponta */
  rebased: boolean
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000)
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}

async function blobShas(
  gh: GitHubClient,
  owner: string,
  repo: string,
  tree: string,
  paths: string[],
) {
  const entries = await readTree(gh, { owner, repo }, tree)
  const map = new Map(entries.map((e) => [e.path, e.sha]))
  return new Map(paths.map((p) => [p, map.get(p) ?? null]))
}

export async function commitChanges(
  gh: GitHubClient,
  ws: WorkspaceRecord,
  changes: FileChange[],
  message: string,
  maxAttempts = 3,
): Promise<CommitResult> {
  if (!ws.lastCommit || !ws.lastTree) throw new Error('Sincronize o workspace antes de gravar.')
  const { owner, repo, branch } = ws
  const base = `/repos/${owner}/${repo}/git`
  const paths = changes.map((c) => c.path)
  let baseShas: Map<string, string | null> | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const head = await branchHead(gh, { owner, repo }, branch)
    let parent = ws.lastCommit
    let parentTree = ws.lastTree
    if (head.commit !== ws.lastCommit) {
      // A branch avançou: só segue se nenhum arquivo tocado mudou desde o último commit lido.
      baseShas ??= await blobShas(gh, owner, repo, ws.lastTree, paths)
      const headShas = await blobShas(gh, owner, repo, head.tree, paths)
      const changed = paths.filter((p) => baseShas!.get(p) !== headShas.get(p))
      if (changed.length) throw new ConflictError(changed, head.commit)
      parent = head.commit
      parentTree = head.tree
    }

    const tree: { path: string; mode: string; type: string; sha: string | null }[] = []
    for (const c of changes) {
      if (c.after === null && !c.base64) {
        tree.push({ path: c.path, mode: '100644', type: 'blob', sha: null })
        continue
      }
      const blob = await gh.request<{ sha: string }>(`${base}/blobs`, {
        method: 'POST',
        body: JSON.stringify({ content: c.base64 ?? toBase64(c.after!), encoding: 'base64' }),
      })
      tree.push({ path: c.path, mode: '100644', type: 'blob', sha: blob.sha })
    }
    const newTree = await gh.request<{ sha: string }>(`${base}/trees`, {
      method: 'POST',
      body: JSON.stringify({ base_tree: parentTree, tree }),
    })
    const commit = await gh.request<{ sha: string }>(`${base}/commits`, {
      method: 'POST',
      body: JSON.stringify({ message, tree: newTree.sha, parents: [parent] }),
    })
    try {
      await gh.request(`${base}/refs/heads/${encodeURIComponent(branch)}`, {
        method: 'PATCH',
        body: JSON.stringify({ sha: commit.sha, force: false }),
      })
      return { commit: commit.sha, parent, rebased: parent !== ws.lastCommit }
    } catch (e) {
      // Outro commit entrou entre a leitura da ponta e a atualização: tenta de novo a partir da nova ponta.
      if (e instanceof GitHubError && e.status === 422 && attempt < maxAttempts) continue
      throw e
    }
  }
  throw new Error('A branch mudou várias vezes seguidas; sincronize e tente de novo.')
}
