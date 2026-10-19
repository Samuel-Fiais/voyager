import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { GitHubClient } from '@/github/client'
import type { WorkspaceRecord } from '@/storage/db'
import { auditLines } from '@/vault/text'
import { buildVaultIndex } from '@/vault/vault-index'
import { FakeGitHub } from '../../testing/fake-github'
import { loadFixtureVault } from '../../testing/fixture-vault'
import { fixtureFiles } from '../../testing/vault-files'
import { appendAudit, auditLine } from './audit-line'
import { commitChanges, ConflictError } from './commit'
import { addListItem, setField } from './frontmatter'
import { planStatusChange } from './plan'
import { stagedErrors } from './validate-change'

const FIXTURE = join(import.meta.dirname, '..', '..', 'fixtures', 'vault')
const NOW = '2026-10-07T10:00:00-03:00'
const ACTOR = 'Samuel Fiais'
const T4 =
  'Projetos/Acme/AC-P001 - Portal de pedidos/Tasks/AC-T004 - Pagamento/AC-T004 - Pagamento.md'

describe('frontmatter e auditoria', () => {
  const text =
    '---\ncode: "X-1"\ntype: task\nstatus: planned\ndeps: []\nupdated_by: "a"\n---\n\ncorpo\n\n## Auditoria\n\n- `t` | a | created | — | planned | x\n'

  it('troca só as linhas tocadas e preserva o resto', () => {
    const after = setField(setField(text, 'status', 'ready'), 'updated_by', 'Samuel Fiais')
    expect(after).toBe(
      text
        .replace('status: planned', 'status: ready')
        .replace('updated_by: "a"', 'updated_by: "Samuel Fiais"'),
    )
    expect(setField(text, 'branch', 'feature/x')).toContain(
      'updated_by: "a"\nbranch: "feature/x"\n---',
    )
    expect(addListItem(text, 'deps', '[[A|A]]')).toContain('deps:\n  - "[[A|A]]"\n')
  })

  it('acrescenta a auditoria sem tocar nas linhas antigas', () => {
    const line = auditLine({
      when: NOW,
      who: ACTOR,
      action: 'status_change',
      from: 'planned',
      to: 'ready',
      evidence: 'ok | sem barra',
    })
    expect(line).toBe(
      '- `2026-10-07T10:00:00-03:00` | Samuel Fiais | status_change | planned | ready | ok / sem barra (via Voyager)',
    )
    const after = appendAudit(text, line)
    expect(auditLines(after.split('---\n').slice(2).join('---\n'))).toEqual([
      '- `t` | a | created | — | planned | x',
      line,
    ])
    const withNext = appendAudit(`${text}\n## Depois\n\ntexto\n`, line)
    expect(withNext).toContain(`${line}\n\n## Depois`)
  })

  it('regras de alteração do --staged: casos válidos e inválidos', () => {
    const before =
      '---\nupdated_at: "a"\n---\n\n## Auditoria\n\n- `2026-10-01T10:00:00-03:00` | x | created | — | a | y\n'
    const ok = before.replace('"a"', `"${NOW}"`) + `- \`${NOW}\` | ${ACTOR} | updated | a | a | z\n`
    expect(stagedErrors('n.md', before, ok)).toEqual([])
    expect(
      stagedErrors(
        'n.md',
        before,
        before.replace('created', 'criada') + `- \`${NOW}\` | x | u | a | a | z\n`,
      )[0],
    ).toMatch(/append-only/)
    expect(stagedErrors('n.md', before, before.replace('"a"', '"b"'))[0]).toMatch(/sem nova linha/)
    expect(stagedErrors('n.md', before, before + `- \`${NOW}\` | x | u | a | a | z\n`)).toEqual([
      'n.md: updated_at não foi atualizado',
    ])
    expect(
      stagedErrors(
        'n.md',
        before,
        before.replace('"a"', '"b"') + '- `ontem` | x | u | a | a | z\n',
      )[0],
    ).toMatch(/ISO 8601/)
    expect(
      stagedErrors(
        'n.md',
        before,
        before.replace('"a"', '"b"') + `- \`${NOW}\` | agent:Grace | u | a | a | z\n`,
      )[0],
    ).toMatch(/minúsculas/)
  })
})

describe('plano de mudança de status', () => {
  const index = buildVaultIndex(fixtureFiles())
  const task = (code: string) => index.byCode.get(code)!

  it('gera diff do frontmatter, auditoria e mensagem, e passa na validação', () => {
    const plan = planStatusChange({
      index,
      note: task('AC-T005'),
      to: 'ready',
      reason: '',
      actor: ACTOR,
      now: NOW,
    })
    expect(plan.errors).toEqual([])
    expect(plan.diffs[0].lines).toEqual([
      '- status: planned',
      '+ status: ready',
      '- updated_by: "agent:claude"',
      '+ updated_by: "Samuel Fiais"',
      '- updated_at: "2026-09-06T10:20:00-03:00"',
      `+ updated_at: "${NOW}"`,
    ])
    expect(plan.auditLines[0].line).toBe(
      `- \`${NOW}\` | Samuel Fiais | status_change | planned | ready | mudança de status (via Voyager)`,
    )
    expect(plan.message).toBe('AC-T005: planned → ready (via Voyager)')
  })

  it('bloquear exige motivo; concluir exige revisão aprovada', () => {
    expect(
      planStatusChange({
        index,
        note: task('AC-T003'),
        to: 'blocked',
        reason: ' ',
        actor: ACTOR,
        now: NOW,
      }).errors[0],
    ).toMatch(/exige o motivo/)
    expect(
      planStatusChange({
        index,
        note: task('AC-T003'),
        to: 'blocked',
        reason: 'sem acesso',
        actor: ACTOR,
        now: NOW,
      }).errors,
    ).toEqual([])
    expect(
      planStatusChange({
        index,
        note: task('AC-T002'),
        to: 'done',
        reason: '',
        actor: ACTOR,
        now: NOW,
      }).errors[0],
    ).toMatch(/Só o fluxo de revisão/)
    expect(
      planStatusChange({
        index,
        note: task('AC-T002'),
        to: 'inventado',
        reason: '',
        actor: ACTOR,
        now: NOW,
      }).errors[0],
    ).toMatch(/não permite/)
  })

  it('o resultado passa no validar-vault.py --staged de verdade', () => {
    const plan = planStatusChange({
      index,
      note: task('AC-T004'),
      to: 'in_progress',
      reason: 'gateway definido',
      actor: ACTOR,
      now: NOW,
    })
    const dir = mkdtempSync(join(tmpdir(), 'voyager-staged-'))
    try {
      cpSync(FIXTURE, dir, { recursive: true })
      const git = (...a: string[]) => execFileSync('git', a, { cwd: dir, encoding: 'utf8' })
      git('init', '-q')
      git('-c', 'user.email=t@t', '-c', 'user.name=t', 'add', '-A')
      git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'base')
      writeFileSync(join(dir, T4), plan.changes[0].after!)
      git('add', '-A')
      const out = execFileSync(
        'python3',
        [join(dir, 'Skills/scripts/validar-vault.py'), '--staged'],
        { cwd: dir, encoding: 'utf8' },
      )
      expect(out).toMatch(/validar-vault: ok/)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('commit no GitHub (simulado)', () => {
  async function setup() {
    const gh = await FakeGitHub.create(loadFixtureVault())
    const client = new GitHubClient(gh.token, gh.fetch)
    const head = gh.head()
    const ws: WorkspaceRecord = {
      id: 'w',
      owner: gh.owner,
      repo: gh.repo,
      branch: 'main',
      lastCommit: head.sha,
      lastTree: head.tree,
      lastSyncAt: null,
      syncIntervalMin: 0,
      fileCount: 0,
      createdAt: NOW,
    }
    const index = buildVaultIndex(fixtureFiles())
    const plan = planStatusChange({
      index,
      note: index.byCode.get('AC-T004')!,
      to: 'ready',
      reason: 'gateway definido',
      actor: ACTOR,
      now: NOW,
    })
    return { gh, client, ws, plan }
  }

  it('gera exatamente um commit e linhas antigas ficam idênticas', async () => {
    const { gh, client, ws, plan } = await setup()
    const before = gh.file(T4)!
    const commits = gh.commits.size
    const res = await commitChanges(client, ws, plan.changes, plan.message)
    expect(gh.commits.size).toBe(commits + 1)
    expect(gh.head().sha).toBe(res.commit)
    expect(gh.head().parents).toEqual([ws.lastCommit])
    expect(gh.head().message).toBe('AC-T004: blocked → ready (via Voyager)')
    expect(res.rebased).toBe(false)
    const after = gh.file(T4)!
    const old = auditLines(before.slice(before.indexOf('\n---\n') + 5))!
    expect(auditLines(after.slice(after.indexOf('\n---\n') + 5))!.slice(0, old.length)).toEqual(old)
    expect(after).toContain('status: ready')
  })

  it('commit concorrente em outro arquivo: reaplica sobre a ponta sem sobrescrever', async () => {
    const { gh, client, ws, plan } = await setup()
    const external = await gh.externalCommit(
      { 'Demandas/Acme/AC-D002 - Relatório de vendas.md': 'mudou por um agente\n' },
      'agente',
    )
    const res = await commitChanges(client, ws, plan.changes, plan.message)
    expect(res.rebased).toBe(true)
    expect(gh.head().parents).toEqual([external])
    expect(gh.file('Demandas/Acme/AC-D002 - Relatório de vendas.md')).toBe('mudou por um agente\n')
    expect(gh.file(T4)).toContain('status: ready')
  })

  it('commit concorrente no mesmo arquivo: conflito e nada é gravado', async () => {
    const { gh, client, ws, plan } = await setup()
    const external = await gh.externalCommit(
      { [T4]: gh.file(T4)!.replace('Pagamento no portal', 'Pagamento via Pix') },
      'agente',
    )
    await expect(commitChanges(client, ws, plan.changes, plan.message)).rejects.toBeInstanceOf(
      ConflictError,
    )
    expect(gh.head().sha).toBe(external)
    expect(gh.file(T4)).toContain('Pagamento via Pix')
    expect(gh.file(T4)).toContain('status: blocked')
  })

  it('corrida na atualização da ref: tenta de novo a partir da nova ponta', async () => {
    const { gh, ws, plan } = await setup()
    let raced = false
    const racy = new GitHubClient(gh.token, async (input, init) => {
      const url = String(input)
      if (!raced && init?.method === 'PATCH' && url.includes('/git/refs/heads/')) {
        raced = true
        await gh.externalCommit({ 'README.md': 'outro commit no meio\n' }, 'corrida')
      }
      return gh.fetch(input, init)
    })
    const res = await commitChanges(racy, ws, plan.changes, plan.message)
    expect(raced).toBe(true)
    expect(gh.head().sha).toBe(res.commit)
    expect(gh.file('README.md')).toBe('outro commit no meio\n')
    expect(gh.file(T4)).toContain('status: ready')
  })
})
