import { RecordPage } from '@/record/record-page'
import { useVault } from '@/vault/vault-context'
import { Page } from './common'

export function NoteView({ path }: { path: string }) {
  const { index } = useVault()
  const note = index?.notes.get(path)
  if (!index) return null
  if (!note) {
    return (
      <Page>
        <p className="text-faint" data-testid="note-missing">
          Nota não encontrada nesta cópia: {path}
        </p>
      </Page>
    )
  }
  return <RecordPage note={note} />
}
