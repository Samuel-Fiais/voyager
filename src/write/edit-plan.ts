import { dirname } from '@/vault/text'
import type { Note, VaultIndex } from '@/vault/vault-index'
import { appendAudit, auditLine } from './audit-line'
import { setField } from './frontmatter'
import { lineDiff } from './line-diff'
import { insertLink, linkLine } from './links'
import { joinNote, splitNote } from './note-parts'
import type { WritePlan } from './plan'
import { nowISO } from './time'
import { validateChanges, type FileChange } from './validate-change'

// Edição do corpo (R10), anexos e vínculos nos dois sentidos (R12), sempre com auditoria (R07).

export interface NewAttachment {
  name: string
  base64: string
}

/** Pasta dos anexos de uma nota: `Anexos/` ao lado dela. */
export function attachmentPath(note: Note, name: string) {
  const safe = name.normalize('NFC').replace(/[\\/:*?"<>|#^[\]]/g, '-')
  return `${dirname(note.path) ? `${dirname(note.path)}/` : ''}Anexos/${safe}`
}

function touch(
  text: string,
  actor: string,
  now: string,
  action: string,
  status: string | null,
  evidence: string,
) {
  let after = setField(text, 'updated_by', actor)
  after = setField(after, 'updated_at', now)
  return appendAudit(
    after,
    auditLine({ when: now, who: actor, action, from: status ?? '—', to: status ?? '—', evidence }),
  )
}

export function planEdit({
  index,
  note,
  body,
  attachments = [],
  actor,
  now = nowISO(),
}: {
  index: VaultIndex
  note: Note
  body: string
  attachments?: NewAttachment[]
  actor: string
  now?: string
}): WritePlan {
  const parts = splitNote(note.text)
  const edited = joinNote(parts, body)
  const changed = edited !== note.text
  const evidence = `edição do conteúdo${attachments.length ? ` e ${attachments.length} anexo${attachments.length > 1 ? 's' : ''}` : ''}`
  const after =
    changed || attachments.length
      ? touch(edited, actor, now, 'updated', note.status, evidence)
      : note.text
  const changes: FileChange[] = [{ path: note.path, before: note.text, after }]
  for (const a of attachments)
    changes.push({
      path: attachmentPath(note, a.name),
      before: null,
      after: null,
      base64: a.base64,
    })
  const errors =
    changed || attachments.length
      ? validateChanges(index.files, changes)
      : ['Nada mudou no conteúdo.']
  const bodyDiff = lineDiff(parts.body.replace(/\s*$/, ''), body.replace(/\s*$/, ''))
  const added = bodyDiff.filter((l) => l.startsWith('+')).length
  const removed = bodyDiff.filter((l) => l.startsWith('-')).length
  return {
    title: `${note.code ?? note.name}: edição do conteúdo`,
    changes,
    diffs: [
      { path: `${note.path} · +${added} −${removed} linhas`, lines: bodyDiff },
      ...attachments.map((a) => ({
        path: attachmentPath(note, a.name),
        lines: [`+ anexo novo (${Math.round((a.base64.length * 3) / 4 / 1024)} KB)`],
      })),
    ],
    auditLines: [
      {
        path: note.path,
        line: auditLine({
          when: now,
          who: actor,
          action: 'updated',
          from: note.status ?? '—',
          to: note.status ?? '—',
          evidence,
        }),
      },
    ],
    message: `${note.code ?? note.name}: ${evidence} (via Voyager)`,
    errors,
  }
}

/** Liga A a B e B de volta a A, com auditoria nas duas notas, no mesmo commit. */
export function planLink({
  index,
  from,
  to,
  nature,
  actor,
  now = nowISO(),
}: {
  index: VaultIndex
  from: Note
  to: Note
  nature?: string
  actor: string
  now?: string
}): WritePlan {
  const errors: string[] = []
  if (from.path === to.path) errors.push('Uma nota não pode ser ligada a ela mesma.')
  const aAfter = touch(
    insertLink(from.text, to.type, linkLine(to, nature)),
    actor,
    now,
    'updated',
    from.status,
    `vínculo para ${to.code ?? to.title}`,
  )
  const bAfter = touch(
    insertLink(to.text, from.type, linkLine(from)),
    actor,
    now,
    'updated',
    to.status,
    `vínculo de volta de ${from.code ?? from.title}`,
  )
  const changes: FileChange[] = [
    { path: from.path, before: from.text, after: aAfter },
    { path: to.path, before: to.text, after: bAfter },
  ]
  if (!errors.length) errors.push(...validateChanges(index.files, changes))
  return {
    title: `${from.code ?? from.title} ↔ ${to.code ?? to.title}`,
    changes,
    diffs: changes.map((c) => ({
      path: c.path,
      lines: lineDiff(c.before!, c.after!).filter((l) => !l.includes('updated_')),
    })),
    auditLines: [
      {
        path: from.path,
        line: auditLine({
          when: now,
          who: actor,
          action: 'updated',
          from: from.status ?? '—',
          to: from.status ?? '—',
          evidence: `vínculo para ${to.code ?? to.title}`,
        }),
      },
      {
        path: to.path,
        line: auditLine({
          when: now,
          who: actor,
          action: 'updated',
          from: to.status ?? '—',
          to: to.status ?? '—',
          evidence: `vínculo de volta de ${from.code ?? from.title}`,
        }),
      },
    ],
    message: `${from.code ?? from.title}: vínculo com ${to.code ?? to.title} (via Voyager)`,
    errors,
  }
}
