import { describe, expect, it } from 'vitest'
import { transitionsFrom } from '@/vault/contracts'
import { buildVaultIndex } from '@/vault/vault-index'
import { fixtureFiles } from '../../testing/vault-files'
import { approvedReviews, checkTransition, REASON_REQUIRED } from './status-rules'

describe('transições por type (lidas do contrato do vault)', () => {
  const files = fixtureFiles()
  const index = buildVaultIndex(files)

  it('task, demanda, projeto e plano seguem as tabelas dos contratos', () => {
    expect(transitionsFrom(index.contracts, 'task', 'in_progress')).toEqual([
      'planned',
      'ready',
      'in_review',
      'changes_requested',
      'blocked',
      'done',
      'cancelled',
    ])
    expect(transitionsFrom(index.contracts, 'demand', 'discovered')).toEqual([
      'needs_clarification',
      'ready',
      'declined',
    ])
    expect(transitionsFrom(index.contracts, 'project', 'active')).toEqual([
      'planning',
      'on_hold',
      'blocked',
      'completed',
      'cancelled',
    ])
    expect(transitionsFrom(index.contracts, 'implementation_plan', 'approved')).toEqual([
      'draft',
      'in_review',
      'superseded',
    ])
  })

  it('Concluída só com revisão aprovada ligada à task', () => {
    const done = index.byCode.get('AC-T001')!
    expect(approvedReviews(index, done).map((r) => r.code)).toEqual(['AC-T001-REV001'])
    const review = index.byCode.get('AC-T002')!
    expect(checkTransition(index, review, 'done')).toMatchObject({ allowed: false })

    // a mesma task com uma revisão aprovada passa a poder ser concluída
    const withReview = new Map(files)
    const dir = review.path.replace(/\/[^/]+$/, '')
    withReview.set(
      `${dir}/Revisões/AC-T002-REV001 - Catálogo de produtos.md`,
      `---\ncode: "AC-T002-REV001"\ntype: review_record\ntask: "[[${review.path.replace(/\.md$/, '')}|AC-T002]]"\nstatus: approved\n---\n`,
    )
    const idx2 = buildVaultIndex(withReview)
    expect(checkTransition(idx2, idx2.byCode.get('AC-T002')!, 'done')).toEqual({
      allowed: true,
      reasonRequired: false,
    })
  })

  it('motivo obrigatório só nas transições que pedem', () => {
    expect([...REASON_REQUIRED].sort()).toEqual([
      'blocked',
      'cancelled',
      'changes_requested',
      'declined',
      'rejected',
    ])
    expect(checkTransition(index, index.byCode.get('AC-D002')!, 'declined')).toEqual({
      allowed: true,
      reasonRequired: true,
    })
  })
})
