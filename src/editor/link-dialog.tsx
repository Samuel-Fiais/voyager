import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Note } from '@/vault/vault-index'
import { planLink } from '@/write/edit-plan'
import { useWriter } from '@/write/writer'
import { Dialog, Field, inputClass } from './dialog'
import { NotePicker } from './note-picker'

/** Liga a nota atual a outra, com o vínculo de volta e auditoria nas duas (R12). */
export function LinkDialog({ note, onClose }: { note: Note; onClose: () => void }) {
  const { start } = useWriter()
  const [target, setTarget] = useState<Note | null>(null)
  const [nature, setNature] = useState('')
  return (
    <Dialog title={`Vincular ${note.code ?? note.title}`} onClose={onClose} testId="link-dialog">
      <Field label="Nota relacionada">
        <NotePicker
          value={target}
          onChange={setTarget}
          filter={(n) => n.path !== note.path}
          testId="link-target"
        />
      </Field>
      <Field label="Natureza da relação (opcional)">
        <input
          className={inputClass}
          value={nature}
          onChange={(e) => setNature(e.target.value)}
          placeholder="Continuação de, Corrige, Originou…"
        />
      </Field>
      <div className="flex justify-end gap-2.5">
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="commit"
          disabled={!target}
          onClick={() => {
            if (!target) return
            const a = note.path
            const b = target.path
            onClose()
            start({
              makePlan: (idx, _reason, actor) => {
                const from = idx.notes.get(a)
                const to = idx.notes.get(b)
                return from && to
                  ? planLink({ index: idx, from, to, nature: nature.trim() || undefined, actor })
                  : null
              },
            })
          }}
          data-testid="link-continue"
        >
          Continuar
        </Button>
      </div>
    </Dialog>
  )
}
