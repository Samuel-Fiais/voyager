import { describe, expect, it } from 'vitest'
import { loadFixtureVault } from '../../testing/fixture-vault'
import { ENTITY_CONTRACT, TASK_CONTRACT, parseContracts } from './contracts'
import { isStatusField, statusLabel } from './labels'

describe('rótulos visuais de status', () => {
  it('traduz todos os status permitidos pelos contratos do vault', () => {
    const files = loadFixtureVault()
    const contracts = parseContracts(String(files[ENTITY_CONTRACT]), String(files[TASK_CONTRACT]))
    const statuses = new Set([...contracts.allowed.values()].flatMap((allowed) => [...allowed]))
    expect(statuses.size).toBeGreaterThan(40)
    for (const status of statuses) {
      expect(statusLabel(status), status).not.toBe(status)
      expect(statusLabel(status), status).not.toContain('_')
    }
  })

  it('traduz status auxiliares de PR e documentação', () => {
    expect(['not_created', 'open', 'approved', 'merged', 'closed'].map(statusLabel)).toEqual([
      'Não criado',
      'Aberto',
      'Aprovado',
      'Integrado',
      'Encerrado',
    ])
    expect(['not_assessed', 'updated', 'not_applicable'].map(statusLabel)).toEqual([
      'Não avaliada',
      'Atualizada',
      'Não se aplica',
    ])
  })

  it('formata valores ausentes e preserva status novos de forma legível', () => {
    for (const value of [null, undefined, '', '—', 'None']) expect(statusLabel(value)).toBe('—')
    expect(statusLabel('aguardando_validacao')).toBe('Aguardando validacao')
    expect(isStatusField('pull_request_status')).toBe(true)
    expect(isStatusField('status_evidence')).toBe(false)
    expect(isStatusField('routing')).toBe(false)
  })
})
