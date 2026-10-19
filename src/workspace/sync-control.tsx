import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { syncLabel } from './sync-label'
import { useWorkspace } from './workspace-context'

/** Órbita animada: um ponto percorre o anel enquanto sincroniza. */
export function Orbit({ active, error }: { active: boolean; error?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
      <circle cx="8" cy="8" r="6" fill="none" stroke="var(--vy-orbit)" strokeDasharray="2 2" />
      <g className={cn(active && 'origin-center animate-spin [animation-duration:1.4s]')}>
        <circle cx="8" cy="2" r="1.8" fill={error ? 'var(--vy-nasa)' : 'var(--vy-strong)'} />
      </g>
    </svg>
  )
}

export function SyncControl() {
  const { active, sync, syncNow } = useWorkspace()
  if (!active) return null
  const busy = sync.status === 'syncing'
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className={cn(
          'flex min-w-0 items-center gap-1.5 text-label',
          sync.status === 'error' ? 'text-nasa' : 'text-faint',
        )}
        role="status"
        data-testid="sync-status"
        title={active.lastCommit ? `Último commit lido: ${active.lastCommit}` : undefined}
      >
        <Orbit active={busy} error={sync.status === 'error'} />
        <span className="hidden truncate md:inline">{syncLabel(sync, active.lastSyncAt)}</span>
      </span>
      <Button variant="commit" onClick={() => void syncNow()} disabled={busy} data-testid="sync">
        {busy ? 'Sincronizando' : 'Sincronizar'}
      </Button>
    </div>
  )
}
