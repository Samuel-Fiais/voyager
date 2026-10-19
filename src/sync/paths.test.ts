import { describe, expect, it } from 'vitest'
import { diffTree } from './diff'
import { isIgnored, isTextPath } from './paths'

describe('filtro de pastas', () => {
  it('ignora .obsidian, .trash e .git', () => {
    expect(isIgnored('.obsidian/app.json')).toBe(true)
    expect(isIgnored('.trash/x.md')).toBe(true)
    expect(isIgnored('.git/HEAD')).toBe(true)
    expect(isIgnored('.obsidian')).toBe(true)
    expect(isIgnored('Projetos/.obsidian-nota.md')).toBe(false)
    expect(isIgnored('.github/workflows/ci.yml')).toBe(false)
    expect(isIgnored('Demandas/x.md')).toBe(false)
  })

  it('separa texto de anexos binários', () => {
    expect(isTextPath('a/b.md')).toBe(true)
    expect(isTextPath('.voyager/views/painel.json')).toBe(true)
    expect(isTextPath('x/diagrama.canvas')).toBe(true)
    expect(isTextPath('x/foto.PNG')).toBe(false)
    expect(isTextPath('x/doc.pdf')).toBe(false)
  })
})

describe('diferença por SHA', () => {
  it('classifica adicionados, alterados, removidos e iguais', () => {
    const local = new Map([
      ['a.md', '1'],
      ['b.md', '2'],
      ['c.md', '3'],
    ])
    const diff = diffTree(local, [
      { path: 'a.md', sha: '1', size: 1 },
      { path: 'b.md', sha: '9', size: 1 },
      { path: 'd.md', sha: '4', size: 1 },
    ])
    expect(diff.added.map((e) => e.path)).toEqual(['d.md'])
    expect(diff.modified.map((e) => e.path)).toEqual(['b.md'])
    expect(diff.removed).toEqual(['c.md'])
    expect(diff.unchanged).toBe(1)
  })
})
