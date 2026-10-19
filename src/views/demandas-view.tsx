import { useMemo } from 'react'
import { StatusGlyph } from '@/components/status-glyph'
import { useNav } from '@/shell/nav'
import { noteId } from '@/shell/nav-ids'
import { statusLabel } from '@/vault/labels'
import { useVault } from '@/vault/vault-context'
import { queryNotes } from '@/vault/vault-index'
import { Page, ViewHeader } from './common'

export function DemandasView() {
  const { index } = useVault()
  const { open } = useNav()
  const demands = useMemo(() => (index ? queryNotes(index, { type: 'demand' }) : []), [index])
  if (!index) return null
  return (
    <Page>
      <ViewHeader
        meta={['View', 'type = demand', `${demands.length} registros`]}
        title="Demandas"
      />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13.5px]" data-testid="demand-table">
          <thead>
            <tr>
              {['Código', 'Título', 'Status', 'Encaminhamento', 'Cliente'].map((h) => (
                <th
                  key={h}
                  className="border-b-2 border-strong py-2 pr-3 text-left label-caps whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {demands.map((d) => (
              <tr
                key={d.path}
                tabIndex={0}
                className="cursor-pointer hover:bg-elevated focus-visible:bg-elevated focus-visible:outline-none"
                onClick={() => open(noteId(d.path))}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && open(noteId(d.path))}
              >
                <td className="border-b py-2.5 pr-3 align-top font-mono text-[12px] text-strong">
                  {d.code}
                </td>
                <td className="border-b py-2.5 pr-3 align-top text-strong">{d.title}</td>
                <td className="border-b py-2.5 pr-3 align-top whitespace-nowrap text-secondary">
                  <span className="inline-flex items-center gap-2">
                    <StatusGlyph status={d.status} size={11} />
                    {statusLabel(d.status)}
                  </span>
                </td>
                <td className="border-b py-2.5 pr-3 align-top font-mono text-[12px] text-secondary">
                  {String(d.data.routing ?? '—')}
                </td>
                <td className="border-b py-2.5 pr-3 align-top text-secondary">
                  {d.client ? (index.notes.get(d.client)?.title ?? '—') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Page>
  )
}
