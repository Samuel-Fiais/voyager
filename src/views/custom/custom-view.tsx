import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatWhen } from '@/record/time'
import { useVault } from '@/vault/vault-context'
import { Page, ViewHeader } from '../common'
import { parseView } from './view-def'
import { ViewDialog } from './view-dialog'
import { ViewBody } from './view-render'

/** View versionada em .voyager/views/<id>.json. */
export function CustomView({ path }: { path: string }) {
  const { index } = useVault()
  const [editing, setEditing] = useState(false)
  if (!index) return null
  const text = index.files.get(path)
  const view = text ? parseView(text) : null
  if (!view) {
    return (
      <Page>
        <p className="text-faint">View inválida ou inexistente: {path}</p>
      </Page>
    )
  }
  const q = view.query
  const filter = [
    q.type && `type = ${[q.type].flat().join(', ')}`,
    q.status && `status = ${[q.status].flat().join(', ')}`,
    q.client && `cliente ${q.client}`,
    q.project && `projeto ${q.project}`,
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <Page>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <ViewHeader meta={['View', filter || 'todas as notas', path]} title={view.title} />
        <Button onClick={() => setEditing(true)} data-testid="edit-view">
          Editar view
        </Button>
      </div>
      <ViewBody
        index={index}
        kind={view.kind}
        query={view.query}
        columns={view.columns}
        by={view.by}
      />
      <p className="text-[12px] text-faint">
        Atualizada {formatWhen(view.updated_at)} por {view.updated_by} · {view.audit.length}{' '}
        registro{view.audit.length > 1 ? 's' : ''} de auditoria no JSON.
      </p>
      {editing && <ViewDialog onClose={() => setEditing(false)} edit={{ path, view }} />}
    </Page>
  )
}
