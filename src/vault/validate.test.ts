import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadFixtureVault } from '../../testing/fixture-vault'
import { fixtureFiles, toVaultFiles } from '../../testing/vault-files'
import { formatReport, loadRules, validateVault } from './validate'

const FIXTURE = join(import.meta.dirname, '..', '..', 'fixtures', 'vault')

function python(vaultDir: string, ...args: string[]) {
  try {
    return execFileSync('python3', [join(vaultDir, 'Skills/scripts/validar-vault.py'), ...args], {
      encoding: 'utf8',
    })
  } catch (e) {
    return (e as { stdout: string }).stdout
  }
}

function pythonReport(vaultDir: string) {
  const out = python(vaultDir, '--report')
  const [report, rest] = out.split(/\n\n(?=\d+ erro)/)
  const errors = rest
    .split('\n')
    .slice(1)
    .filter((l) => l.startsWith('  - '))
    .map((l) => l.slice(4))
  return { report: report.trim(), errors }
}

describe('paridade com o validar-vault.py', () => {
  it('vault sintético: mesmo relatório por type e status, sem erros', () => {
    const files = fixtureFiles()
    const rules = loadRules(files)
    const ts = validateVault(files, rules)
    const py = pythonReport(FIXTURE)
    expect(formatReport(ts, rules)).toBe(py.report)
    expect(ts.errors).toEqual(py.errors)
    expect(ts.errors).toEqual([])
  })

  it('casos inválidos do contrato: mesmos erros do script', () => {
    const dir = mkdtempSync(join(tmpdir(), 'vault-invalido-'))
    try {
      cpSync(FIXTURE, dir, { recursive: true })
      const broken: Record<string, string> = {
        'Demandas/Acme/AC-D010 - Status errado.md':
          '---\ncode: "AC-D010"\ntype: "demand"\nstatus: concluida\ncreated_by: "agent:Grace"\ncreated_at: "2026-10-01"\nupdated_by: "agent:claude"\nupdated_at: "2026-10-01T10:00:00-03:00"\n---\n\nVer [[Nota que não existe]] e [contrato](Skills/references/contrato-de-auditoria.md).\n',
        'Demandas/Acme/Nome errado.md':
          '---\ncode: "AC-D011"\ntype: demand\nstatus: ready\ncreated_by: "agent:claude"\ncreated_at: "2026-10-01T10:00:00-03:00"\nupdated_by: "agent:claude"\nupdated_at: "2026-10-01T10:00:00-03:00"\n---\n\nsem auditoria\n',
        'Demandas/Acme/AC-D012 - Tipo inventado.md':
          '---\ncode: "AC-D012"\ntype: implementacao\nstatus: ready\ncreated_by: "agent:claude"\ncreated_at: "2026-10-01T10:00:00-03:00"\nupdated_by: "agent:claude"\nupdated_at: "2026-10-01T10:00:00-03:00"\n---\n\n## Auditoria\n\n',
        'Demandas/Acme/AC-D001 - Duplicada.md':
          '---\ncode: "AC-D001"\ntype: demand\nstatus: ready\ncreated_by: "agent:claude"\ncreated_at: "2026-10-01T10:00:00-03:00"\nupdated_by: "agent:claude"\nupdated_at: "2026-10-01T10:00:00-03:00"\n---\n\n## Auditoria\n\n- `2026-10-01T10:00:00-03:00` | agent:claude | created | — | ready | x\n',
        'Demandas/Acme/Solta.md': 'sem frontmatter\n',
        'Demandas/Acme/AC-X1 - Code fora.md':
          '---\ncode: "AC-X1"\ntype: demand\nstatus: ready\ncreated_by: "agent:claude"\ncreated_at: "2026-10-01T10:00:00-03:00"\nupdated_by: "agent:claude"\nupdated_at: "2026-10-01T10:00:00-03:00"\n---\n\n## Auditoria\n\n- `2026-10-01T10:00:00-03:00` | agent:claude | created | — | ready | x\n',
      }
      for (const [p, text] of Object.entries(broken)) writeFileSync(join(dir, p), text)
      const files = toVaultFiles({ ...loadFixtureVault(dir) })
      const ts = validateVault(files)
      const py = pythonReport(dir)
      expect(ts.errors.length).toBeGreaterThan(8)
      expect(ts.errors).toEqual(py.errors)
      expect(formatReport(ts, loadRules(files))).toBe(py.report)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

// Comparação local com um vault real: VOYAGER_KB_DIR=/caminho/do/knowledge-base npx vitest run validate
const KB = process.env.VOYAGER_KB_DIR
describe.runIf(KB)('paridade no vault real', () => {
  it('relatório e erros iguais aos do script', () => {
    const files = toVaultFiles(loadFixtureVault(KB))
    const ts = validateVault(files)
    const py = pythonReport(KB!)
    expect(formatReport(ts, loadRules(files))).toBe(py.report)
    expect(ts.errors).toEqual(py.errors)
    console.log(
      `vault real: ${ts.notes} notas, ${ts.errors.length} erro(s), relatório igual ao do script`,
    )
  })
})
