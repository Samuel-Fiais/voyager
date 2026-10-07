import { describe, expect, it } from 'vitest'
import { fixtureFiles } from '../../testing/vault-files'
import { parseAuditLine } from './audit'
import { initialStatusOf, statusesOf, transitionsFrom, TASK_CONTRACT } from './contracts'
import { formatReport, loadRules, validateVault } from './validate'
import { buildVaultIndex, countByTypeAndStatus, queryNotes, templatesFor } from './vault-index'

const P = 'Projetos/Acme/AC-P001 - Portal de pedidos'

describe('índice do vault sintético', () => {
  const files = fixtureFiles()
  const index = buildVaultIndex(files)

  it('lê frontmatter, código e título das notas canônicas (fora de Skills/)', () => {
    const task = index.byCode.get('AC-T004')!
    expect(task.type).toBe('task')
    expect(task.status).toBe('blocked')
    expect(task.title).toBe('Pagamento')
    expect([...index.notes.keys()].some((p) => p.startsWith('Skills/'))).toBe(false)
    expect(index.notes.get('README.md')!.hasFrontmatter).toBe(false)
  })

  it('contagens por type e status batem com o validador', () => {
    const counts = countByTypeAndStatus(index)
    const rules = loadRules(files)
    const report = validateVault(files, rules).report
    expect(counts).toEqual(report)
    expect(counts.get('task')!.get('blocked')).toBe(1)
    expect(formatReport(validateVault(files, rules), rules)).toContain('task: 6 |')
  })

  it('resolve wikilinks por caminho e por nome, com backlinks', () => {
    const project = `${P}/AC-P001 - Portal de pedidos.md`
    const task = index.byCode.get('AC-T001')!
    expect(task.project).toBe(project)
    expect(task.client).toBe('Clientes/C001 - Acme.md')
    const back = index.backlinks.get(project)!
    expect(
      [...back].filter((p) => p.includes('/Tasks/AC-T00') && !p.includes('/Implementação/')).length,
    ).toBe(6)
    // ![[login.png]] resolve pelo nome do anexo
    const review = index.byCode.get('AC-T001-REV001')!
    expect(review.links.find((l) => l.target === 'login.png')!.resolved).toMatch(
      /Evidências\/login\.png$/,
    )
    expect(index.brokenLinks).toEqual([])
  })

  it('lista links quebrados', () => {
    const broken = new Map(files)
    broken.set(
      'Demandas/Acme/AC-D009 - Quebrada.md',
      '---\ncode: "AC-D009"\n---\n\nVer [[Nota inexistente]] e [[Clientes/C001 - Acme]].\n',
    )
    const idx = buildVaultIndex(broken)
    expect(idx.brokenLinks).toEqual([
      { from: 'Demandas/Acme/AC-D009 - Quebrada.md', target: 'Nota inexistente' },
    ])
  })

  it('lê as linhas de auditoria', () => {
    const demand = index.byCode.get('AC-D001')!
    expect(demand.audit.map((a) => [a.action, a.from, a.to])).toEqual([
      ['created', '—', 'discovered'],
      ['status_change', 'discovered', 'needs_clarification'],
      ['status_change', 'needs_clarification', 'ready'],
    ])
    expect(
      parseAuditLine('- `2026-10-06T21:38:59-03:00` | agent:claude | updated | a | b | x | y'),
    ).toMatchObject({
      who: 'agent:claude',
      evidence: 'x | y',
    })
  })

  it('consulta por type, status, cliente e projeto', () => {
    expect(
      queryNotes(index, { type: 'task', status: ['in_review', 'blocked'] }).map((n) => n.code),
    ).toEqual(['AC-T002', 'AC-T004'])
    expect(
      queryNotes(index, { client: 'Clientes/C001 - Acme.md', type: 'demand' }).map((n) => n.code),
    ).toEqual(['AC-D001', 'AC-D002'])
    expect(
      queryNotes(index, { project: `${P}/AC-P001 - Portal de pedidos.md`, type: 'task' }),
    ).toHaveLength(6)
    expect(queryNotes(index, { type: 'task', text: 'catalogo' }).map((n) => n.code)).toEqual([
      'AC-T002',
    ])
  })

  it('transições vêm do contrato do vault, não de código fixo', () => {
    expect(statusesOf(index.contracts, 'task')).toEqual([
      'planned',
      'ready',
      'in_progress',
      'in_review',
      'changes_requested',
      'blocked',
      'done',
      'cancelled',
    ])
    expect(transitionsFrom(index.contracts, 'demand', 'ready')).toEqual([
      'discovered',
      'needs_clarification',
      'declined',
    ])
    expect(initialStatusOf(index.contracts, 'demand')).toBe('discovered')
    expect(templatesFor(index, 'task')[0].path).toMatch(/executar-task\/assets\/template-task\.md$/)

    const changed = new Map(files)
    changed.set(
      TASK_CONTRACT,
      files
        .get(TASK_CONTRACT)!
        .replace('| `cancelled` |', '| `on_hold` | Pausada. |\n| `cancelled` |'),
    )
    const idx = buildVaultIndex(changed)
    expect(transitionsFrom(idx.contracts, 'task', 'blocked')).toContain('on_hold')
  })
})
