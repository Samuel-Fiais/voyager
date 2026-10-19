import { lazy, Suspense, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Note } from '@/vault/vault-index'
import { attachmentPath, planEdit, type NewAttachment } from '@/write/edit-plan'
import { splitNote } from '@/write/note-parts'
import { useWriter } from '@/write/writer'
import type { CodeEditorHandle } from './code-editor'

const CodeEditor = lazy(() => import('./code-editor'))

async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000)
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}

const MAX_ATTACHMENT = 20 * 1024 * 1024

/** Edição do corpo da nota; o frontmatter e a auditoria ficam com o Voyager. */
export function NoteEditor({ note, onDone }: { note: Note; onDone: () => void }) {
  const { start } = useWriter()
  const [initial] = useState(() =>
    splitNote(note.text).body.replace(/^\n+/, '').replace(/\s*$/, '\n'),
  )
  const [draft, setDraft] = useState(initial)
  const [attachments, setAttachments] = useState<NewAttachment[]>([])
  const [error, setError] = useState<string>()
  const editor = useRef<CodeEditorHandle | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  async function attach(files: FileList | null) {
    if (!files) return
    for (const file of [...files]) {
      if (file.size > MAX_ATTACHMENT) {
        setError(`${file.name} passa de 20 MB.`)
        continue
      }
      const base64 = await fileToBase64(file)
      setAttachments((a) => [...a.filter((x) => x.name !== file.name), { name: file.name, base64 }])
      const path = attachmentPath(note, file.name)
      editor.current?.insert(`${/^image\//.test(file.type) ? '!' : ''}[[${path.split('/').pop()}]]`)
    }
  }

  function save() {
    const path = note.path
    const body = `\n${draft.replace(/\s*$/, '')}\n`
    const files = attachments
    start({
      makePlan: (idx, _reason, actor) => {
        const current = idx.notes.get(path)
        return current
          ? planEdit({ index: idx, note: current, body, attachments: files, actor })
          : null
      },
      onCommitted: onDone,
    })
  }

  return (
    <div className="grid max-w-[78ch] gap-2.5" data-testid="note-editor">
      <span className="label-caps">Markdown · {note.path.split('/').pop()}</span>
      <Suspense fallback={<p className="label-caps">Abrindo o editor…</p>}>
        <CodeEditor
          value={initial}
          onChange={setDraft}
          onReady={(h) => (editor.current = h)}
          label={`Conteúdo de ${note.code ?? note.title}`}
        />
      </Suspense>
      <small className="text-[12px] text-faint">
        O frontmatter e a seção ## Auditoria não aparecem aqui; o Voyager cuida deles ao salvar.
      </small>
      {attachments.length > 0 && (
        <ul className="text-[12.5px] text-secondary" data-testid="attachments">
          {attachments.map((a) => (
            <li key={a.name}>
              <span className="font-mono">{attachmentPath(note, a.name)}</span> ·{' '}
              {Math.round((a.base64.length * 3) / 4 / 1024)} KB
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="text-nasa">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInput}
          type="file"
          multiple
          hidden
          onChange={(e) => void attach(e.target.files)}
          data-testid="attach-input"
        />
        <Button onClick={() => fileInput.current?.click()}>Anexar arquivo</Button>
        <span className="flex-1" />
        <Button onClick={onDone}>Cancelar</Button>
        <Button
          variant="commit"
          onClick={save}
          disabled={draft === initial && !attachments.length}
          data-testid="save-note"
        >
          Salvar
        </Button>
      </div>
    </div>
  )
}
