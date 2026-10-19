import type { GitHubClient } from './client'
import type { TreeEntry } from '@/sync/diff'

// Leitura de um repositório de vault (VO-DEC008): ponta da branch, árvore recursiva,
// textos pelo GraphQL em lotes e binários pela API de blobs.

export interface RepoRef {
  owner: string
  repo: string
}

export interface BranchHead {
  commit: string
  tree: string
}

interface BranchResponse {
  commit: { sha: string; commit: { tree: { sha: string } } }
}

interface TreeResponse {
  sha: string
  truncated: boolean
  tree: { path: string; type: string; sha: string; size?: number }[]
}

export interface Branch {
  name: string
}

export async function listBranches(gh: GitHubClient, { owner, repo }: RepoRef): Promise<Branch[]> {
  const all: Branch[] = []
  for (let page = 1; page <= 10; page++) {
    const batch = await gh.request<Branch[]>(
      `/repos/${owner}/${repo}/branches?per_page=100&page=${page}`,
    )
    all.push(...batch)
    if (batch.length < 100) break
  }
  return all
}

export async function branchHead(
  gh: GitHubClient,
  { owner, repo }: RepoRef,
  branch: string,
): Promise<BranchHead> {
  const res = await gh.request<BranchResponse>(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`,
  )
  return { commit: res.commit.sha, tree: res.commit.commit.tree.sha }
}

export async function readTree(
  gh: GitHubClient,
  { owner, repo }: RepoRef,
  treeSha: string,
): Promise<TreeEntry[]> {
  const res = await gh.request<TreeResponse>(
    `/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`,
  )
  if (res.truncated) {
    throw new Error('A árvore do repositório é grande demais para uma única leitura.')
  }
  return res.tree
    .filter((e) => e.type === 'blob')
    .map((e) => ({ path: e.path, sha: e.sha, size: e.size ?? 0 }))
}

export const GRAPHQL_BATCH = 100

interface BlobText {
  text: string | null
  isTruncated: boolean
  isBinary: boolean | null
}

/** Texto dos blobs pelo GraphQL, em lotes. Devolve null para binário ou truncado. */
export async function readTexts(
  gh: GitHubClient,
  { owner, repo }: RepoRef,
  shas: string[],
  onBatch?: (done: number) => void,
): Promise<Map<string, string | null>> {
  const out = new Map<string, string | null>()
  const batches: string[][] = []
  for (let i = 0; i < shas.length; i += GRAPHQL_BATCH)
    batches.push(shas.slice(i, i + GRAPHQL_BATCH))
  let done = 0
  await runPool(batches, 4, async (batch) => {
    const fields = batch
      .map((sha, i) => `b${i}: object(oid: "${sha}") { ... on Blob { text isTruncated isBinary } }`)
      .join('\n')
    const query = `query($owner: String!, $repo: String!) { repository(owner: $owner, name: $repo) { ${fields} } }`
    const res = await gh.request<{
      data?: { repository: Record<string, BlobText | null> }
      errors?: { message: string }[]
    }>('/graphql', { method: 'POST', body: JSON.stringify({ query, variables: { owner, repo } }) })
    if (!res.data) throw new Error(res.errors?.[0]?.message ?? 'Falha no GraphQL do GitHub.')
    batch.forEach((sha, i) => {
      const blob = res.data!.repository[`b${i}`]
      out.set(sha, blob && !blob.isTruncated && !blob.isBinary ? blob.text : null)
    })
    done += batch.length
    onBatch?.(done)
  })
  return out
}

/** Conteúdo bruto de um blob (anexos binários). */
export function readBlob(gh: GitHubClient, { owner, repo }: RepoRef, sha: string): Promise<Blob> {
  return gh.raw(`/repos/${owner}/${repo}/git/blobs/${sha}`)
}

export async function runPool<T>(items: T[], size: number, worker: (item: T) => Promise<void>) {
  let next = 0
  const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++]
      await worker(item)
    }
  })
  await Promise.all(runners)
}
