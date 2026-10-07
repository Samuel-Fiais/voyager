import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChoiceGroup, Dialog, Field, inputClass } from '@/editor/dialog'
import { statusesOf } from '@/vault/contracts'
import { statusLabel, typeLabel } from '@/vault/labels'
import { useVault } from '@/vault/vault-context'
import { queryNotes } from '@/vault/vault-index'
import { useWriter } from '@/write/writer'
import { COLUMNS, type GroupBy } from './query'
import { planCreateView, planUpdateView, type ViewDefinition, type ViewKind } from './view-def'

const KIND_LABEL: Record<ViewKind, string> = {
  table: 'Tabela',
  kanban: 'Kanban (só leitura)',
  chart: 'Gráfico de barras',
}
const BY_LABEL: Record<GroupBy, string> = {
  status: 'Status',
  type: 'Tipo',
  client: 'Cliente',
  project: 'Projeto',
  week: 'Semana de criação',
}

/** Cria ou edita uma view versionada em .voyager/views/ (gravada pelo motor de escrita). */
export function ViewDialog({
  onClose,
  edit,
}: {
  onClose: () => void
  edit?: { path: string; view: ViewDefinition }
}) {
  const { index } = useVault()
  const { start } = useWriter()
  const v = edit?.view
  const [title, setTitle] = useState(v?.title ?? '')
  const [kind, setKind] = useState<ViewKind>(v?.kind ?? 'table')
  const [type, setType] = useState<string>(
    Array.isArray(v?.query.type) ? (v?.query.type[0] ?? '') : (v?.query.type ?? 'task'),
  )
  const [statuses, setStatuses] = useState<string[]>(v?.query.status ? [v.query.status].flat() : [])
  const [client, setClient] = useState(v?.query.client ?? '')
  const [project, setProject] = useState(v?.query.project ?? '')
  const [columns, setColumns] = useState<string[]>(v?.columns ?? ['code', 'title', 'status'])
  const [by, setBy] = useState<GroupBy>(v?.by ?? 'status')
  if (!index) return null
  const types = [...index.contracts.allowed.keys()].sort()
  const clients = queryNotes(index, { type: ['company', 'individual'] })
  const projects = queryNotes(index, { type: 'project' })
  const input = {
    title,
    kind,
    query: {
      type: type || undefined,
      status: statuses.length ? statuses : undefined,
      client: client || undefined,
      project: project || undefined,
    },
    columns: kind === 'table' ? columns : undefined,
    by: kind === 'chart' ? by : undefined,
  }
  const toggle = (list: string[], x: string) =>
    list.includes(x) ? list.filter((y) => y !== x) : [...list, x]

  return (
    <Dialog
      title={edit ? `Editar view · ${v?.title}` : 'Nova view'}
      onClose={onClose}
      testId="view-dialog"
    >
      <Field label="Título">
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          data-testid="view-title"
          autoFocus
        />
      </Field>
      <Field label="Forma">
        <select
          className={inputClass}
          value={kind}
          onChange={(e) => setKind(e.target.value as ViewKind)}
          data-testid="view-kind"
        >
          {(Object.keys(KIND_LABEL) as ViewKind[]).map((k) => (
            <option key={k} value={k}>
              {KIND_LABEL[k]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Type">
        <select
          className={inputClass}
          value={type}
          onChange={(e) => (setType(e.target.value), setStatuses([]))}
          data-testid="view-type"
        >
          <option value="">qualquer</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {typeLabel(t)} · {t}
            </option>
          ))}
        </select>
      </Field>
      {type && (
        <ChoiceGroup label="Status (nenhum = todos)">
          {statusesOf(index.contracts, type).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={statuses.includes(s)}
              className={`border px-2 py-1 text-[12px] ${statuses.includes(s) ? 'border-strong bg-panel text-strong' : 'text-secondary'}`}
              onClick={() => setStatuses(toggle(statuses, s))}
            >
              {statusLabel(s)}
            </button>
          ))}
        </ChoiceGroup>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cliente">
          <select
            className={inputClass}
            value={client}
            onChange={(e) => setClient(e.target.value)}
            data-testid="view-client"
          >
            <option value="">todos</option>
            {clients.map((c) => (
              <option key={c.path} value={c.code ?? ''}>
                {c.code} · {c.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Projeto">
          <select
            className={inputClass}
            value={project}
            onChange={(e) => setProject(e.target.value)}
            data-testid="view-project"
          >
            <option value="">todos</option>
            {projects.map((p) => (
              <option key={p.path} value={p.code ?? ''}>
                {p.code} · {p.title}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {kind === 'table' && (
        <ChoiceGroup label="Colunas">
          {Object.entries(COLUMNS).map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-pressed={columns.includes(k)}
              className={`border px-2 py-1 text-[12px] ${columns.includes(k) ? 'border-strong bg-panel text-strong' : 'text-secondary'}`}
              onClick={() => setColumns(toggle(columns, k))}
            >
              {label}
            </button>
          ))}
        </ChoiceGroup>
      )}
      {kind === 'chart' && (
        <Field label="Agrupar por">
          <select
            className={inputClass}
            value={by}
            onChange={(e) => setBy(e.target.value as GroupBy)}
            data-testid="view-by"
          >
            {(Object.keys(BY_LABEL) as GroupBy[]).map((k) => (
              <option key={k} value={k}>
                {BY_LABEL[k]}
              </option>
            ))}
          </select>
        </Field>
      )}
      <div className="flex justify-end gap-2.5">
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="commit"
          disabled={!title.trim()}
          onClick={() => {
            onClose()
            start({
              makePlan: (idx, _reason, actor) =>
                edit
                  ? planUpdateView(idx, edit.path, input, actor)
                  : planCreateView(idx, input, actor),
            })
          }}
          data-testid="view-continue"
        >
          Continuar
        </Button>
      </div>
    </Dialog>
  )
}
