import type { VaultIndex } from '@/vault/vault-index'
import { parseView } from '@/views/custom/view-def'
import { isView, notePathOf, VIEW_LABEL, viewPathOf, type NavId } from './nav-ids'

export interface NavMeta {
  code: string
  label: string
  status: string | null
}

/** Código e rótulo de uma aba ou item de navegação. */
export function navMeta(id: NavId, index: VaultIndex | null): NavMeta | null {
  if (isView(id)) return { code: 'VIEW', label: VIEW_LABEL[id], status: null }
  const vpath = viewPathOf(id)
  if (vpath) {
    const text = index?.files.get(vpath)
    const view = text ? parseView(text) : null
    return { code: 'VIEW', label: view?.title ?? vpath.split('/').pop()!, status: null }
  }
  const path = notePathOf(id)
  if (!path) return null
  const note = index?.notes.get(path)
  if (!note)
    return index
      ? null
      : { code: '…', label: path.split('/').pop()!.replace(/\.md$/, ''), status: null }
  return { code: note.code ?? 'NOTA', label: note.title, status: note.status }
}
