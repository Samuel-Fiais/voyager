import { useMemo, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { LinkDialog } from '@/editor/link-dialog'
import { NoteEditor } from '@/editor/note-editor'
import { StatusGlyph } from '@/components/status-glyph'
import { displayBody } from '@/markdown/note-body'
import { Markdown, type CodeRenderer } from '@/markdown/markdown'
import { useNav } from '@/shell/nav'
import { noteId } from '@/shell/nav-ids'
import { NoteRow, SectionHeader } from '@/views/common'
import { statusesOf } from '@/vault/contracts'
import { statusLabel, typeLabel } from '@/vault/labels'
import { useVault } from '@/vault/vault-context'
import { byCode, queryNotes, type Note } from '@/vault/vault-index'
import { RightPanel } from './right-panel'
import { StatusMenu } from './status-menu'
import { formatShort } from './time'
import { ProjectTrajectory } from './trajectory'

function MetaLink({ path }: { path: string | null }) {
  const { index } = useVault()
  const { open } = useNav()
  const note = path ? index?.notes.get(path) : null
  if (!note) return null
  return (
    <button className="uppercase hover:text-strong" onClick={() => open(noteId(note.path))}>
      {note.code ? `${note.code} · ` : ''}
      {note.title}
    </button>
  )
}

function Tag({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 border px-[9px] py-1 text-[12.5px] text-secondary">
      <span className="font-mono text-[11px] text-strong">{label}</span>
      <span className="truncate">{children}</span>
    </span>
  )
}

export function RecordHeader({ note, actions }: { note: Note; actions?: ReactNode }) {
  const created = note.data.created_at ? formatShort(String(note.data.created_at)) : null
  const pr = note.data.pull_request_url ? String(note.data.pull_request_url) : null
  return (
    <div className="grid gap-1.5 pt-3.5 rule-record" data-testid="note-header">
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[11.5px] font-semibold tracking-[0.08em] text-faint uppercase">
        <span>{typeLabel(note.type)}</span>
        {note.type !== 'company' && note.type !== 'individual' && <MetaLink path={note.client} />}
        {note.project && note.project !== note.path && <MetaLink path={note.project} />}
        {created && <span>criado em {created}</span>}
      </div>
      {note.code && (
        <div className="font-mono text-[42px] leading-[0.95] font-extrabold tracking-tight break-all text-strong sm:text-code">
          {note.code}
        </div>
      )}
      <h1 className="mt-1.5 max-w-[38ch] text-title text-balance text-strong">{note.title}</h1>
      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        {note.status && <StatusMenu note={note} />}
        {note.data.routing != null && <Tag label="routing">{String(note.data.routing)}</Tag>}
        {note.type === 'task' && (
          <Tag label="PR">
            {pr ? (
              <a
                href={pr}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                {String(note.data.pull_request ?? 'PR')} ·{' '}
                {String(note.data.pull_request_status ?? '')}
              </a>
            ) : (
              String(note.data.pull_request_status ?? '—')
            )}
          </Tag>
        )}
        {note.data.branch != null && note.data.branch !== '' && (
          <Tag label="branch">{String(note.data.branch)}</Tag>
        )}
        {actions && <span className="flex-1" />}
        {actions}
      </div>
    </div>
  )
}

const PROJECT_ORDER = [
  'blocked',
  'changes_requested',
  'in_review',
  'in_progress',
  'ready',
  'planned',
  'done',
  'cancelled',
]

function ProjectSection({ note }: { note: Note }) {
  const { index } = useVault()
  const tasks = useMemo(
    () =>
      index
        ? queryNotes(index, { type: 'task' })
            .filter((t) => t.project === note.path)
            .sort(byCode)
        : [],
    [index, note.path],
  )
  if (!index) return null
  const order = [
    ...PROJECT_ORDER,
    ...statusesOf(index.contracts, 'task').filter((s) => !PROJECT_ORDER.includes(s)),
  ]
  const done = tasks.filter((t) => t.status === 'done').length
  return (
    <>
      <div>
        <SectionHeader title="Trajetória" aside={`${done} de ${tasks.length} tasks concluídas`} />
        <ProjectTrajectory tasks={tasks} />
      </div>
      {order.map((s) => {
        const group = tasks.filter((t) => t.status === s)
        if (!group.length) return null
        return (
          <div key={s} data-testid={`project-group-${s}`}>
            <SectionHeader
              title={
                <>
                  <StatusGlyph status={s} size={11} />
                  {statusLabel(s)}
                </>
              }
              aside={group.length}
            />
            {group.map((t) => (
              <NoteRow key={t.path} note={t} aside={String(t.data.pull_request_status ?? '')} />
            ))}
          </div>
        )
      })}
    </>
  )
}

function ClientSection({ note }: { note: Note }) {
  const { index } = useVault()
  const related = useMemo(
    () =>
      index
        ? queryNotes(index, { client: note.path }).filter(
            (n) =>
              n.path !== note.path &&
              ['demand', 'project', 'repository', 'commercial_proposal', 'meeting'].includes(
                n.type ?? '',
              ),
          )
        : [],
    [index, note.path],
  )
  return (
    <div>
      <SectionHeader title="Documentos relacionados" aside={related.length} />
      {related.map((n) => (
        <NoteRow key={n.path} note={n} aside={typeLabel(n.type).toLowerCase()} />
      ))}
      {!related.length && (
        <p className="py-3 text-[12.5px] text-faint">Nenhuma demanda ou projeto deste cliente.</p>
      )}
    </div>
  )
}

/** Página de registro: cabeçalho, corpo renderizado e painel direito (desce abaixo de 1100px). */
export function RecordPage({ note, renderCode }: { note: Note; renderCode?: CodeRenderer }) {
  const body = useMemo(() => displayBody(note.body, note.name), [note.body, note.name])
  const [editing, setEditing] = useState(false)
  const [linking, setLinking] = useState(false)
  const actions =
    note.hasFrontmatter && !editing ? (
      <>
        <Button onClick={() => setLinking(true)} data-testid="link-note">
          Vincular
        </Button>
        <Button onClick={() => setEditing(true)} data-testid="edit-note">
          Editar
        </Button>
      </>
    ) : null
  return (
    <div className="grid min-h-full grid-cols-[minmax(0,1fr)] min-[1100px]:grid-cols-[minmax(0,1fr)_310px]">
      <article
        className="grid content-start gap-7 px-4 pt-6 pb-16 sm:px-12 sm:pt-8"
        data-testid="record"
      >
        <RecordHeader note={note} actions={actions} />
        {note.type === 'project' && <ProjectSection note={note} />}
        {(note.type === 'company' || note.type === 'individual') && <ClientSection note={note} />}
        {editing ? (
          <NoteEditor note={note} onDone={() => setEditing(false)} />
        ) : body ? (
          <Markdown source={body} notePath={note.path} renderCode={renderCode} />
        ) : (
          <p className="text-faint">Nota sem conteúdo além das propriedades.</p>
        )}
      </article>
      <RightPanel note={note} />
      {linking && <LinkDialog note={note} onClose={() => setLinking(false)} />}
    </div>
  )
}
