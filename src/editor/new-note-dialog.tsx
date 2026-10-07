import { useMemo, useState } from 'react'
import { useSession } from '@/auth/session-context'
import { Button } from '@/components/ui/button'
import { typeLabel } from '@/vault/labels'
import { useVault } from '@/vault/vault-context'
import { type Note } from '@/vault/vault-index'
import { defaultFolder, needsClient, parentKeyOf, planCreate } from '@/write/create'
import { useWriter } from '@/write/writer'
import { Dialog, Field, inputClass } from './dialog'
import { NotePicker } from './note-picker'

const HIDDEN_TYPES = new Set(['task_provider_configuration'])
const PROJECT_TYPES = new Set([
  'task',
  'decision',
  'implementation_plan',
  'business_rule',
  'meeting',
  'delivery',
  'project_test',
  'project_closure',
])

const skillOf = (path: string) => path.split('/').slice(-3, -2)[0] ?? path

/** Nova nota a partir do template da Skill do type (R11). */
export function NewNoteDialog({
  onClose,
  defaults,
}: {
  onClose: () => void
  defaults?: { client?: Note | null; project?: Note | null; parent?: Note | null }
}) {
  const { index } = useVault()
  const { session } = useSession()
  const { start } = useWriter()
  const templates = useMemo(
    () =>
      (index?.templates ?? [])
        .filter((t) => !HIDDEN_TYPES.has(t.type) && !t.path.includes('exemplo'))
        .sort(
          (a, b) =>
            typeLabel(a.type).localeCompare(typeLabel(b.type), 'pt-BR') ||
            a.path.localeCompare(b.path),
        ),
    [index],
  )
  const [tplPath, setTplPath] = useState(
    () => templates.find((t) => t.type === 'demand')?.path ?? templates[0]?.path ?? '',
  )
  const [name, setName] = useState('')
  const [client, setClient] = useState<Note | null>(defaults?.client ?? null)
  const [project, setProject] = useState<Note | null>(defaults?.project ?? null)
  const [parent, setParent] = useState<Note | null>(defaults?.parent ?? null)
  const [folder, setFolder] = useState<string | null>(null)
  const template = templates.find((t) => t.path === tplPath)
  if (!index || !template) return null
  const actor = session?.name?.trim() || session?.login || 'Samuel Fiais'
  const parentKey = parentKeyOf(template)
  const showProject = PROJECT_TYPES.has(template.type) || template.text.includes('{{project_')
  const preview = planCreate({
    index,
    template,
    name: name || 'Nome',
    client,
    project,
    parent,
    folder: folder ?? undefined,
    actor,
  })
  const suggested = defaultFolder(index, template.type, { client, project, parent })

  return (
    <Dialog title="Nova nota" onClose={onClose} testId="new-note">
      <Field label="Tipo (template da Skill)">
        <select
          className={inputClass}
          value={tplPath}
          onChange={(e) => (setTplPath(e.target.value), setFolder(null))}
          data-testid="new-type"
        >
          {templates.map((t) => (
            <option key={t.path} value={t.path}>
              {typeLabel(t.type)} · {t.type} · {skillOf(t.path)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Nome">
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Integração com o ERP"
          data-testid="new-name"
          autoFocus
        />
      </Field>
      {(needsClient(template) || template.text.includes('client:')) && (
        <Field label={needsClient(template) ? 'Cliente (iniciais do código)' : 'Cliente'}>
          <NotePicker
            value={client}
            onChange={(n) => (setClient(n), setFolder(null))}
            filter={(n) => n.type === 'company' || n.type === 'individual'}
            testId="new-client"
          />
        </Field>
      )}
      {showProject && (
        <Field label="Projeto">
          <NotePicker
            value={project}
            onChange={(n) => (setProject(n), setFolder(null))}
            filter={(n) => n.type === 'project' && (!client || n.client === client.path)}
            testId="new-project"
          />
        </Field>
      )}
      {parentKey && (
        <Field label={`Registro pai (${parentKey.replace('_code', '')})`}>
          <NotePicker
            value={parent}
            onChange={(n) => (setParent(n), setFolder(null))}
            testId="new-parent"
          />
        </Field>
      )}
      <Field label="Pasta">
        <input
          className={`${inputClass} font-mono text-[12.5px]`}
          value={
            folder ??
            (suggested.ownFolder
              ? `${suggested.folder}/${preview.code} - ${name || 'Nome'}`
              : suggested.folder)
          }
          onChange={(e) => setFolder(e.target.value)}
          data-testid="new-folder"
        />
      </Field>
      <div
        className="border bg-bg px-3 py-2 font-mono text-[12px] text-secondary"
        data-testid="new-preview"
      >
        <span className="text-strong">{preview.code}</span> → {preview.path}
      </div>
      {name.trim() && preview.errors.length > 0 && (
        <ul className="border-l-[3px] border-nasa bg-bg px-3 py-2 text-[13px] text-secondary">
          {preview.errors.slice(0, 4).map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      <div className="flex justify-end gap-2.5">
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="commit"
          disabled={!name.trim() || preview.errors.length > 0}
          onClick={() => {
            const input = { template, name, client, project, parent, folder: folder ?? undefined }
            onClose()
            start({
              makePlan: (idx, _reason, who) => planCreate({ ...input, index: idx, actor: who }),
            })
          }}
          data-testid="new-continue"
        >
          Continuar
        </Button>
      </div>
    </Dialog>
  )
}
