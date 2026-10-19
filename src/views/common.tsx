import type { ReactNode } from 'react'
import { StatusGlyph } from '@/components/status-glyph'
import { useNav } from '@/shell/nav'
import { noteId } from '@/shell/nav-ids'
import type { Note } from '@/vault/vault-index'

export function ViewHeader({ meta, title }: { meta: string[]; title: string }) {
  return (
    <div className="grid gap-1.5 pt-3.5 rule-record">
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[11.5px] font-semibold tracking-[0.08em] text-faint uppercase">
        {meta.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
      <h1 className="text-title font-bold text-strong">{title}</h1>
    </div>
  )
}

export function SectionHeader({ title, aside }: { title: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-1 flex flex-wrap items-baseline justify-between gap-4 pb-2 rule-section">
      <h2 className="flex items-center gap-2 text-[12.5px] font-extrabold tracking-[0.1em] text-strong uppercase">
        {title}
      </h2>
      {aside && <small className="text-[12px] text-faint">{aside}</small>}
    </div>
  )
}

/** Linha de lista com glifo, código, título e complemento; abre a nota. */
export function NoteRow({ note, aside }: { note: Note; aside?: ReactNode }) {
  const { open } = useNav()
  return (
    <button
      className="grid w-full grid-cols-[16px_96px_minmax(0,1fr)_auto] items-center gap-2.5 border-b py-2.5 text-left text-[13px] hover:bg-elevated"
      onClick={() => open(noteId(note.path))}
    >
      <StatusGlyph status={note.status} size={11} />
      <span className="truncate font-mono text-[11.5px] text-strong">{note.code ?? '—'}</span>
      <span className="truncate text-secondary">{note.title}</span>
      {aside !== undefined && <small className="font-mono text-[10.5px] text-faint">{aside}</small>}
    </button>
  )
}

export function Page({ children }: { children: ReactNode }) {
  return (
    <div className="grid content-start gap-9 px-4 pt-6 pb-16 sm:px-10 sm:pt-[30px]">{children}</div>
  )
}
