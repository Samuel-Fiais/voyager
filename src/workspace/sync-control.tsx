import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { syncLabel } from './sync-label'
import { useWorkspace } from './workspace-context'
import { Icon } from '@/components/icon'

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
  const label = syncLabel(sync, active.lastSyncAt)
  return (
    <div
      className="flex h-8 min-w-0 items-stretch divide-x divide-line border border-line"
      data-testid="sync-toolbar"
    >
      <span
        className={cn(
          'flex min-w-0 items-center gap-2 px-2.5 text-small leading-none sm:max-w-[14rem] sm:px-3',
          sync.status === 'error' ? 'text-nasa' : 'text-secondary',
        )}
        role="status"
        data-testid="sync-status"
        title={active.lastCommit ? `Último commit lido: ${active.lastCommit}` : undefined}
      >
        <Orbit active={busy} error={sync.status === 'error'} />
        <span className="hidden truncate sm:inline">{label}</span>
      </span>
      <Button
        variant="commit"
        className="h-8 shrink-0 border-0 px-2.5 sm:px-3"
        onClick={() => void syncNow()}
        disabled={busy}
        aria-label={busy ? 'Sincronizando' : 'Sincronizar'}
        data-testid="sync"
      >
        <Icon name="sync" className="sm:hidden" />
        <span className="hidden sm:inline">{busy ? 'Sincronizando' : 'Sincronizar'}</span>
      </Button>
    </div>
  )
}
