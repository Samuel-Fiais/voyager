import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { auditLines } from '@/vault/text'
import { buildVaultIndex, templatesFor } from '@/vault/vault-index'
import { fixtureFiles } from '../../testing/vault-files'
import { planCreate, nextCode } from './create'
import { planEdit, planLink } from './edit-plan'
import { lineDiff } from './line-diff'
import { insertLink } from './links'
import { splitNote } from './note-parts'
import type { FileChange } from './validate-change'

const FIXTURE = join(import.meta.dirname, '..', '..', 'fixtures', 'vault')
const NOW = '2026-10-07T11:00:00-03:00'
const ACTOR = 'Samuel Fiais'
const index = buildVaultIndex(fixtureFiles())
const note = (code: string) => index.byCode.get(code)!

/** Aplica as mudanças num git com o vault sintético e roda o validar-vault.py --staged real. */
function pythonStaged(changes: FileChange[]) {
  const dir = mkdtempSync(join(tmpdir(), 'voyager-create-'))
  try {
    cpSync(FIXTURE, dir, { recursive: true })
    const git = (...a: string[]) =>
      execFileSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...a], {
        cwd: dir,
        encoding: 'utf8',
      })
    git('init', '-q')
    git('add', '-A')
    git('commit', '-qm', 'base')
    for (const c of changes) {
      mkdirSync(dirname(join(dir, c.path)), { recursive: true })
      writeFileSync(join(dir, c.path), c.base64 ? Buffer.from(c.base64, 'base64') : c.after!)
    }
    git('add', '-A')
    return execFileSync('python3', [join(dir, 'Skills/scripts/validar-vault.py'), '--staged'], {
      cwd: dir,
      encoding: 'utf8',
    })
  } catch (e) {
    return (e as { stdout: string }).stdout
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

describe('criação a partir dos templates', () => {
  it('próximo código livre no vault inteiro', () => {
    expect(nextCode(index, 'AC-D{{sequence}}')).toBe('AC-D003')
    expect(nextCode(index, 'AC-T{{sequence}}')).toBe('AC-T007')
    expect(nextCode(index, 'C{{sequence}}')).toBe('C002')
    expect(nextCode(index, 'ZZ-D{{sequence}}')).toBe('ZZ-D001')
  })

  it('demanda nova: template correto, código, pasta e vínculo de volta no cliente no mesmo commit', () => {
    const plan = planCreate({
      index,
      template: templatesFor(index, 'demand')[0],
      name: 'Integração com o ERP',
      client: note('C001'),
      actor: ACTOR,
      now: NOW,
    })
    expect(plan.errors).toEqual([])
    expect(plan.code).toBe('AC-D003')
    expect(plan.path).toBe('Demandas/Acme/AC-D003 - Integração com o ERP.md')
    const created = plan.changes[0].after!
    expect(created).toContain('code: "AC-D003"')
    expect(created).toContain('type: demand\nstatus: discovered')
    expect(created).toContain('client: "[[Clientes/C001 - Acme|C001 - Acme]]"')
    expect(created).toContain(`created_by: "${ACTOR}"`)
    expect(created).toContain('## Pedido e problema')
    expect(created).not.toMatch(/\{\{/)
    expect(auditLines(splitNote(created).tail)).toEqual([
      `- \`${NOW}\` | ${ACTOR} | created | — | discovered | criação do registro (via Voyager)`,
    ])
    const client = plan.changes[1]
    expect(client.path).toBe('Clientes/C001 - Acme.md')
    expect(client.after).toContain(
      '- [[Demandas/Acme/AC-D003 - Integração com o ERP|AC-D003 - Integração com o ERP]] (demanda)',
    )
    expect(pythonStaged(plan.changes)).toMatch(/validar-vault: ok/)
  })

  it('task nova no projeto: pasta própria, vínculo em ### Tasks', () => {
    const plan = planCreate({
      index,
      template: templatesFor(index, 'task')[0],
      name: 'Cupons',
      client: note('C001'),
      project: note('AC-P001'),
      actor: ACTOR,
      now: NOW,
    })
    expect(plan.errors).toEqual([])
    expect(plan.path).toBe(
      'Projetos/Acme/AC-P001 - Portal de pedidos/Tasks/AC-T007 - Cupons/AC-T007 - Cupons.md',
    )
    expect(plan.changes[0].after).toContain(
      'project: "[[Projetos/Acme/AC-P001 - Portal de pedidos/AC-P001 - Portal de pedidos|AC-P001 - Portal de pedidos]]"',
    )
    const project = plan.changes[1].after!
    expect(project).toMatch(
      /### Tasks\n\n(- .*\n)*- \[\[Projetos\/Acme\/AC-P001 - Portal de pedidos\/Tasks\/AC-T007 - Cupons\/AC-T007 - Cupons\|AC-T007 - Cupons\]\] \(task\)/,
    )
    expect(pythonStaged(plan.changes)).toMatch(/validar-vault: ok/)
  })

  it('registro filho usa o código do pai e a subpasta do pai', () => {
    const plan = planCreate({
      index,
      template: templatesFor(index, 'review_record')[0],
      name: 'Catálogo de produtos',
      parent: note('AC-T002'),
      actor: ACTOR,
      now: NOW,
    })
    expect(plan.errors).toEqual([])
    expect(plan.code).toBe('AC-T002-REV001')
    expect(plan.path).toBe(
      'Projetos/Acme/AC-P001 - Portal de pedidos/Tasks/AC-T002 - Catálogo de produtos/Revisões/AC-T002-REV001 - Catálogo de produtos.md',
    )
    expect(plan.changes[0].after).toContain(
      'task: "[[Projetos/Acme/AC-P001 - Portal de pedidos/Tasks/AC-T002 - Catálogo de produtos/AC-T002 - Catálogo de produtos|AC-T002 - Catálogo de produtos]]"',
    )
    expect(pythonStaged(plan.changes)).toMatch(/validar-vault: ok/)
  })

  it('sem cliente com iniciais não cria', () => {
    const plan = planCreate({
      index,
      template: templatesFor(index, 'demand')[0],
      name: 'X',
      actor: ACTOR,
      now: NOW,
    })
    expect(plan.errors[0]).toMatch(/Escolha um cliente/)
  })
})

describe('edição e vínculos', () => {
  it('edição muda só as linhas do corpo e acrescenta uma linha de auditoria', () => {
    const d = note('AC-D001')
    const { body } = splitNote(d.text)
    const edited = body.replace(
      'Atrasos de entrega por pedidos digitados errado.',
      'Atrasos de entrega e retrabalho no faturamento.',
    )
    const plan = planEdit({ index, note: d, body: edited, actor: ACTOR, now: NOW })
    expect(plan.errors).toEqual([])
    expect(plan.diffs[0].lines).toEqual([
      '- Atrasos de entrega por pedidos digitados errado.',
      '+ Atrasos de entrega e retrabalho no faturamento.',
    ])
    expect(plan.diffs[0].path).toContain('+1 −1 linhas')
    const after = plan.changes[0].after!
    expect(lineDiff(d.text, after).filter((l) => !/updated_(by|at)/.test(l))).toEqual([
      '- Atrasos de entrega por pedidos digitados errado.',
      '+ Atrasos de entrega e retrabalho no faturamento.',
      `+ - \`${NOW}\` | ${ACTOR} | updated | ready | ready | edição do conteúdo (via Voyager)`,
    ])
    expect(plan.message).toBe('AC-D001: edição do conteúdo (via Voyager)')
    expect(pythonStaged(plan.changes)).toMatch(/validar-vault: ok/)
  })

  it('edição com anexo grava o arquivo ao lado da nota', () => {
    const d = note('AC-D001')
    const plan = planEdit({
      index,
      note: d,
      body: `${splitNote(d.text).body.trimEnd()}\n\n![[diagrama.png]]\n`,
      attachments: [{ name: 'diagrama.png', base64: 'iVBORw0KGgo=' }],
      actor: ACTOR,
      now: NOW,
    })
    expect(plan.errors).toEqual([])
    expect(plan.changes[1]).toMatchObject({
      path: 'Demandas/Acme/Anexos/diagrama.png',
      base64: 'iVBORw0KGgo=',
    })
  })

  it('vínculo nos dois sentidos com auditoria nas duas notas', () => {
    const plan = planLink({
      index,
      from: note('AC-D002'),
      to: note('AC-P001'),
      nature: 'pode virar projeto',
      actor: ACTOR,
      now: NOW,
    })
    expect(plan.errors).toEqual([])
    expect(plan.changes[0].after).toContain(
      '## Vínculos\n\n- [[Projetos/Acme/AC-P001 - Portal de pedidos/AC-P001 - Portal de pedidos|AC-P001 - Portal de pedidos]] (pode virar projeto)',
    )
    // o projeto não tem seção de demandas: o vínculo de volta vai para ## Vínculos
    expect(plan.changes[1].after).toContain(
      '## Vínculos\n\n- [[Demandas/Acme/AC-D002 - Relatório de vendas|AC-D002 - Relatório de vendas]] (demanda)',
    )
    expect(pythonStaged(plan.changes)).toMatch(/validar-vault: ok/)
  })

  it('não duplica vínculo existente', () => {
    const c = note('C001')
    expect(
      insertLink(
        c.text,
        'demand',
        '- [[Demandas/Acme/AC-D001 - Portal de pedidos|AC-D001 - Portal de pedidos]] (demanda)',
      ),
    ).toBe(c.text)
  })
})
