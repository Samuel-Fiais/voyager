import { describe, expect, it } from 'vitest'
import { buildVaultIndex, countByTypeAndStatus } from '@/vault/vault-index'
import { loadRules, validateVault } from '@/vault/validate'
import { fixtureFiles } from '../../../testing/vault-files'
import {
  groupCount,
  normalizeQuery,
  parseBlock,
  runQuery,
  typeCounts,
  weekKey,
  weeklyActivity,
} from './query'
import { parseView, planCreateView, planUpdateView, serializeView } from './view-def'

const files = fixtureFiles()
const index = buildVaultIndex(files)
const ACTOR = 'Samuel Fiais'
const NOW = '2026-10-07T12:00:00-03:00'

describe('consultas e métricas', () => {
  it('filtra por type, status, cliente e projeto (códigos)', () => {
    expect(
      runQuery(index, normalizeQuery({ type: 'task', status: ['blocked', 'in_review'] })).map(
        (n) => n.code,
      ),
    ).toEqual(['AC-T002', 'AC-T004'])
    expect(runQuery(index, normalizeQuery({ type: 'demand', client: 'C001' }))).toHaveLength(2)
    expect(runQuery(index, normalizeQuery({ type: 'task', project: 'AC-P001' }))).toHaveLength(6)
    expect(runQuery(index, normalizeQuery({ type: 'task', project: 'XX-P999' }))).toEqual([])
  })

  it('registros por type batem com o validador', () => {
    const report = validateVault(files, loadRules(files)).report
    const expected = [...report].map(([t, m]) => [t, [...m.values()].reduce((a, b) => a + b, 0)])
    expect(
      typeCounts(index)
        .map((t) => [t.key, t.value])
        .sort(),
    ).toEqual(expected.sort())
    expect(countByTypeAndStatus(index).get('task')!.get('blocked')).toBe(1)
  })

  it('agrupa por status e conta a atividade por semana', () => {
    const tasks = runQuery(index, { type: 'task' })
    expect(groupCount(index, tasks, 'status').reduce((a, g) => a + g.value, 0)).toBe(6)
    expect(weekKey(new Date(2026, 9, 7))).toBe('2026-S41')
    const weeks = weeklyActivity(index, 8, new Date(2026, 8, 20))
    expect(weeks).toHaveLength(8)
    expect(weeks[7].partial).toBe(true)
    const total = [...index.notes.values()]
      .flatMap((n) => n.audit)
      .filter((a) => {
        const t = Date.parse(a.when)
        return t >= new Date(2026, 6, 27).getTime() && t <= new Date(2026, 8, 20, 23, 59).getTime()
      }).length
    expect(weeks.reduce((a, w) => a + w.value, 0)).toBe(total)
  })

  it('lê o corpo dos blocos e acusa erro de sintaxe', () => {
    expect(parseBlock('type: task\nstatus: [a, b]')).toEqual({
      ok: true,
      value: { type: 'task', status: ['a', 'b'] },
    })
    expect(parseBlock('type: [').ok).toBe(false)
    expect(parseBlock('- a\n- b').ok).toBe(false)
  })
})

describe('views versionadas', () => {
  it('cria .voyager/views/<id>.json com auditoria e edita acrescentando linha', () => {
    const plan = planCreateView(
      index,
      { title: 'Tasks bloqueadas', kind: 'table', query: { type: 'task', status: ['blocked'] } },
      ACTOR,
      NOW,
    )
    expect(plan.errors).toEqual([])
    expect(plan.path).toBe('.voyager/views/tasks-bloqueadas.json')
    const view = parseView(plan.changes[0].after!)!
    expect(view).toMatchObject({
      version: 1,
      id: 'tasks-bloqueadas',
      kind: 'table',
      created_by: ACTOR,
      created_at: NOW,
    })
    expect(view.audit).toEqual([
      `- \`${NOW}\` | ${ACTOR} | created | — | table | view Tasks bloqueadas (via Voyager)`,
    ])
    expect(plan.message).toBe('.voyager/views: nova view "Tasks bloqueadas" (via Voyager)')

    const withView = new Map(files)
    withView.set(plan.path, plan.changes[0].after)
    const idx2 = buildVaultIndex(withView)
    const later = '2026-10-07T13:00:00-03:00'
    const upd = planUpdateView(
      idx2,
      plan.path,
      { title: 'Tasks bloqueadas', kind: 'chart', query: { type: 'task' }, by: 'status' },
      ACTOR,
      later,
    )
    expect(upd.errors).toEqual([])
    const v2 = parseView(upd.changes[0].after!)!
    expect(v2.audit[0]).toBe(view.audit[0])
    expect(v2.audit).toHaveLength(2)
    expect(v2).toMatchObject({ kind: 'chart', by: 'status', updated_at: later, created_at: NOW })
    expect(serializeView(v2).endsWith('}\n')).toBe(true)
  })

  it('recusa cliente ou projeto inexistente', () => {
    expect(
      planCreateView(
        index,
        { title: 'X', kind: 'table', query: { project: 'ZZ-P001' } },
        ACTOR,
        NOW,
      ).errors[0],
    ).toMatch(/não existe/)
  })
})
