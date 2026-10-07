import { formatRelative } from '@/lib/time'
import type { SyncState } from './workspace-context'

const PHASES: Record<string, string> = {
  head: 'Lendo a branch',
  tree: 'Lendo a árvore',
  texts: 'Baixando notas',
  binaries: 'Baixando anexos',
  saving: 'Gravando a cópia',
}

export function syncLabel(sync: SyncState, lastSyncAt: string | null) {
  if (sync.status === 'syncing') {
    const p = sync.progress
    return p ? `${PHASES[p.phase]}${p.total > 1 ? ` ${p.done}/${p.total}` : ''}` : 'Sincronizando'
  }
  if (sync.status === 'error') return sync.error?.message ?? 'Falha na sincronização'
  if (!lastSyncAt) return 'Nunca sincronizado'
  return `Sincronizado ${formatRelative(lastSyncAt)}`
}
