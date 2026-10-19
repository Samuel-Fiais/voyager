import { useState, type ReactNode } from 'react'
import { useNav } from '@/shell/nav'
import { noteId } from '@/shell/nav-ids'
import { useVault } from '@/vault/vault-context'
import { byCode, noteByWikilink, type Note } from '@/vault/vault-index'
import { formatWhen } from './time'
import { AuditTrajectory } from './trajectory'

const HIDDEN = new Set(['created_by', 'created_at', 'updated_by', 'updated_at'])

function H3({ children, count }: { children: ReactNode; count?: number }) {
  return (
    <h3 className="mb-2.5 flex justify-between text-[11px] font-bold tracking-[0.1em] text-faint uppercase">
      {children}
      {count !== undefined && <small className="font-mono">{count}</small>}
    </h3>
  )
}

function NoteLink({ note }: { note: Note }) {
  const { open } = useNav()
  return (
    <button
      className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-2 text-left text-[13px] hover:text-strong"
      onClick={() => open(noteId(note.path))}
    >
      <span className="font-mono text-[11px] text-strong">{note.code ?? '·'}</span>
      <span className="truncate text-secondary">{note.title}</span>
    </button>
  )
}

function Value({ value, from }: { value: unknown; from: string }) {
  const { index } = useVault()
  const { open } = useNav()
  if (value === null || value === undefined || value === '')
    return <span className="text-faint">—</span>
  if (Array.isArray(value)) {
    if (!value.length) return <span className="text-faint">[]</span>
    return (
      <span className="grid gap-0.5">
        {value.map((v, i) => (
          <Value key={i} value={v} from={from} />
        ))}
      </span>
    )
  }
  const text = String(value)
  const wl = text.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/)
  if (wl && index) {
    const target = noteByWikilink(index, wl[1], from)
    if (target) {
      return (
        <button
          className="truncate text-left text-strong underline decoration-faint underline-offset-2"
          onClick={() => open(noteId(target.path))}
        >
          {target.code ?? wl[2] ?? target.title}
        </button>
      )
    }
    return <span className="truncate text-nasa">{wl[2] ?? wl[1]}</span>
  }
  if (/^https?:\/\//.test(text)) {
    return (
      <a
        href={text}
        target="_blank"
        rel="noopener noreferrer"
        className="truncate text-strong underline underline-offset-2"
      >
        {text.replace(/^https?:\/\/(www\.)?/, '')}
      </a>
    )
  }
  return <span className="truncate">{text}</span>
}

export function RightPanel({ note }: { note: Note }) {
  const { index } = useVault()
  const [allBack, setAllBack] = useState(false)
  if (!index) return null
  const out = [
    ...new Map(
      note.links
        .map((l) => (l.resolved ? index.notes.get(l.resolved) : undefined))
        .filter((n): n is Note => !!n && n.path !== note.path)
        .map((n) => [n.path, n]),
    ).values(),
  ].sort(byCode)
  const back = [...(index.backlinks.get(note.path) ?? [])]
    .map((p) => index.notes.get(p))
    .filter((n): n is Note => !!n)
    .sort(byCode)
  const shownBack = allBack ? back : back.slice(0, 12)
  const props = Object.entries(note.data).filter(([k]) => !HIDDEN.has(k))
  const updatedAt = note.data.updated_at ? String(note.data.updated_at) : null

  return (
    <aside
      className="grid content-start gap-[26px] border-t bg-panel px-[18px] pt-5 pb-10 min-[1100px]:border-t-0 min-[1100px]:border-l"
      data-testid="right-panel"
    >
      <div>
        <H3>Propriedades</H3>
        <dl
          className="grid grid-cols-[100px_minmax(0,1fr)] gap-x-2.5 gap-y-[7px] text-[13px]"
          data-testid="properties"
        >
          {props.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="truncate pt-0.5 font-mono text-[11px] text-faint">{k}</dt>
              <dd className="grid min-w-0 text-strong">
                <Value value={v} from={note.path} />
              </dd>
            </div>
          ))}
          {updatedAt && (
            <>
              <dt className="pt-0.5 font-mono text-[11px] text-faint">updated</dt>
              <dd className="min-w-0 truncate text-strong">
                {formatWhen(updatedAt)} · {String(note.data.updated_by ?? '')}
              </dd>
            </>
          )}
        </dl>
      </div>
      {out.length > 0 && (
        <div>
          <H3 count={out.length}>Links</H3>
          <div className="grid gap-1.5" data-testid="links">
            {out.map((n) => (
              <NoteLink key={n.path} note={n} />
            ))}
          </div>
        </div>
      )}
      <div>
        <H3 count={back.length}>Backlinks</H3>
        {back.length ? (
          <div className="grid gap-1.5" data-testid="backlinks">
            {shownBack.map((n) => (
              <NoteLink key={n.path} note={n} />
            ))}
            {back.length > shownBack.length && (
              <button
                className="text-left text-[12px] text-faint hover:text-strong"
                onClick={() => setAllBack(true)}
              >
                mais {back.length - shownBack.length}
              </button>
            )}
          </div>
        ) : (
          <p className="text-[12.5px] text-faint">Nenhuma nota aponta para esta.</p>
        )}
      </div>
      <div>
        <H3 count={note.audit.length}>Auditoria</H3>
        <AuditTrajectory audit={note.audit} />
      </div>
    </aside>
  )
}
