import Dexie, { type EntityTable } from 'dexie'

// Cópia local dos vaults no IndexedDB (VO-DEC003): um registro por workspace e um por arquivo.

export interface WorkspaceRecord {
  /** `<owner>/<repo>@<branch>` */
  id: string
  owner: string
  repo: string
  branch: string
  /** Commit que a cópia local reflete; base dos commits do Voyager. */
  lastCommit: string | null
  lastTree: string | null
  lastSyncAt: string | null
  /** Intervalo da sincronização automática, em minutos; 0 desliga. */
  syncIntervalMin: number
  fileCount: number
  createdAt: string
}

export interface FileRecord {
  workspaceId: string
  path: string
  sha: string
  size: number
  kind: 'text' | 'binary'
  text?: string
  data?: Blob
}

export class VoyagerDB extends Dexie {
  workspaces!: EntityTable<WorkspaceRecord, 'id'>
  files!: Dexie.Table<FileRecord, [string, string]>

  constructor(name = 'voyager') {
    super(name)
    this.version(1).stores({
      workspaces: 'id',
      files: '[workspaceId+path], workspaceId',
    })
  }
}

export const db = new VoyagerDB()

export function workspaceId(owner: string, repo: string, branch: string) {
  return `${owner}/${repo}@${branch}`
}

/** Apaga a cópia de um workspace (arquivos e registro). */
export async function removeWorkspace(database: VoyagerDB, id: string) {
  await database.transaction('rw', database.workspaces, database.files, async () => {
    await database.files.where('workspaceId').equals(id).delete()
    await database.workspaces.delete(id)
  })
}

/** Apaga todas as cópias locais (R14: sair limpa tudo). */
export async function clearAll(database: VoyagerDB) {
  await database.transaction('rw', database.workspaces, database.files, async () => {
    await database.files.clear()
    await database.workspaces.clear()
  })
}
