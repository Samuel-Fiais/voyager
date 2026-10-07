import { useLiveQuery } from '@/lib/use-live-query'
import { db } from '@/storage/db'
import { VaultHealth } from '@/vault/vault-health'
import { formatRelative } from '@/lib/time'
import { useWorkspace } from './workspace-context'

// Resumo provisório do workspace (VO-T003); a navegação completa chega na VO-T005.
export function WorkspaceSummary() {
  const { active, sync } = useWorkspace()
  const counts = useLiveQuery(
    async () => {
      if (!active) return null
      const files = await db.files.where('workspaceId').equals(active.id).toArray()
      return {
        notes: files.filter((f) => f.path.endsWith('.md')).length,
        attachments: files.filter((f) => f.kind === 'binary').length,
        total: files.length,
      }
    },
    [active?.id, active?.lastCommit],
    null,
  )
  if (!active) return null
  const last = sync.last
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="pt-4 rule-record">
        <p className="label-caps">
          Workspace · {active.owner}/{active.repo}
        </p>
        <p className="mt-3 font-mono text-title break-all text-strong">{active.branch}</p>
        <dl
          className="mt-6 grid grid-cols-2 gap-px border bg-line sm:grid-cols-4"
          data-testid="workspace-counts"
        >
          {[
            ['Notas', counts?.notes],
            ['Anexos', counts?.attachments],
            ['Arquivos', counts?.total],
            ['Último commit', active.lastCommit?.slice(0, 7) ?? '—'],
          ].map(([label, value]) => (
            <div key={label as string} className="bg-bg p-3 rule-column">
              <dt className="label-caps">{label}</dt>
              <dd className="mt-1 font-mono text-title text-strong" data-testid={`count-${label}`}>
                {value ?? '—'}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-label text-faint">
          {active.lastSyncAt
            ? `Última sincronização ${formatRelative(active.lastSyncAt)}`
            : 'Ainda não sincronizado'}
          {last &&
            ` · ${last.added} novos, ${last.modified} alterados, ${last.removed} removidos em ${(last.durationMs / 1000).toFixed(1)} s`}
        </p>
      </div>
      <VaultHealth />
    </section>
  )
}
