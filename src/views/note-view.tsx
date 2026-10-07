import { typeLabel } from '@/vault/labels'
import { useVault } from '@/vault/vault-context'
import { Page } from './common'

// Leitura provisória: a renderização completa e as páginas de registro chegam na VO-T006.
export function NoteView({ path }: { path: string }) {
  const { index } = useVault()
  const note = index?.notes.get(path)
  if (!index) return null
  if (!note) {
    return (
      <Page>
        <p className="text-faint">Nota não encontrada nesta cópia: {path}</p>
      </Page>
    )
  }
  return (
    <Page>
      <div className="grid gap-1.5 pt-3.5 rule-record" data-testid="note-header">
        <div className="flex flex-wrap gap-x-3.5 text-[11.5px] font-semibold tracking-[0.08em] text-faint uppercase">
          <span>{typeLabel(note.type)}</span>
          <span>{note.path}</span>
        </div>
        {note.code && (
          <div className="font-mono text-[42px] leading-none font-extrabold text-strong sm:text-code">
            {note.code}
          </div>
        )}
        <h1 className="mt-1.5 text-title text-strong">{note.title}</h1>
      </div>
      <pre className="measure text-[13px] break-words whitespace-pre-wrap text-secondary">
        {note.body}
      </pre>
    </Page>
  )
}
