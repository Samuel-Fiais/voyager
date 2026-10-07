import { transitionsFrom } from '@/vault/contracts'
import { resolveWikilink } from '@/vault/validate'
import type { Note, VaultIndex } from '@/vault/vault-index'

// Regras de mudança de status (R04 a R06).

/** Transições que exigem motivo, que vai para a evidência da auditoria (R06). */
export const REASON_REQUIRED = new Set([
  'blocked',
  'cancelled',
  'changes_requested',
  'declined',
  'rejected',
])

export function reasonLabel(to: string): string {
  switch (to) {
    case 'blocked':
      return 'Motivo do impedimento'
    case 'cancelled':
      return 'Justificativa do cancelamento'
    case 'changes_requested':
      return 'O que precisa mudar'
    case 'declined':
    case 'rejected':
      return 'Motivo da recusa'
    default:
      return 'Evidência ou nota (opcional)'
  }
}

/** Revisões aprovadas ligadas à task (registro `review_record` com `status: approved`). */
export function approvedReviews(index: VaultIndex, task: Note): Note[] {
  return [...index.notes.values()].filter((n) => {
    if (n.type !== 'review_record' || n.status !== 'approved') return false
    const m = typeof n.data.task === 'string' ? n.data.task.match(/\[\[([^\]|]+)/) : null
    if (!m) return false
    const r = resolveWikilink(m[1], n.path, index.linkIndex)
    const path = r && r !== 'self' ? (index.files.has(r) ? r : `${r}.md`) : null
    return path === task.path
  })
}

export interface TransitionCheck {
  allowed: boolean
  /** regra que impede a transição, explicada para Samuel */
  rule?: string
  reasonRequired: boolean
}

export function checkTransition(index: VaultIndex, note: Note, to: string): TransitionCheck {
  const reasonRequired = REASON_REQUIRED.has(to)
  if (!note.type) return { allowed: false, rule: 'A nota não tem type.', reasonRequired }
  if (!transitionsFrom(index.contracts, note.type, note.status).includes(to)) {
    return {
      allowed: false,
      rule: `O contrato de ${note.type} não permite ${to} a partir de ${note.status}.`,
      reasonRequired,
    }
  }
  if (note.type === 'task' && to === 'done' && !approvedReviews(index, note).length) {
    return {
      allowed: false,
      rule: 'Só o fluxo de revisão promove uma task para Concluída. Falta um registro em Revisões/ com status: approved, testes e documentação técnica conferidos (contrato de status de tasks).',
      reasonRequired,
    }
  }
  return { allowed: true, reasonRequired }
}
