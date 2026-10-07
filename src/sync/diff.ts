// Diferença entre a cópia local e a árvore da branch, pelo SHA de cada blob (VO-DEC008).

export interface TreeEntry {
  path: string
  sha: string
  size: number
}

export interface TreeDiff {
  added: TreeEntry[]
  modified: TreeEntry[]
  removed: string[]
  unchanged: number
}

export function diffTree(local: Map<string, string>, remote: TreeEntry[]): TreeDiff {
  const added: TreeEntry[] = []
  const modified: TreeEntry[] = []
  const seen = new Set<string>()
  let unchanged = 0
  for (const entry of remote) {
    seen.add(entry.path)
    const sha = local.get(entry.path)
    if (sha === undefined) added.push(entry)
    else if (sha !== entry.sha) modified.push(entry)
    else unchanged++
  }
  const removed = [...local.keys()].filter((p) => !seen.has(p))
  return { added, modified, removed, unchanged }
}
