import { db } from '@/storage/db'
import type { VaultFiles } from './validate'

export async function loadVaultFiles(workspaceId: string): Promise<VaultFiles> {
  const records = await db.files.where('workspaceId').equals(workspaceId).toArray()
  return new Map(
    records.map((r) => [r.path.normalize('NFC'), r.kind === 'text' ? (r.text ?? '') : null]),
  )
}
