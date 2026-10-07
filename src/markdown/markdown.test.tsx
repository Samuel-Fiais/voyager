import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fixtureFiles } from '../../testing/vault-files'
import { buildVaultIndex } from '@/vault/vault-index'
import { displayBody } from './note-body'
import { splitWikilinks } from './remark-wikilinks'

const index = buildVaultIndex(fixtureFiles())
const open = vi.fn()

vi.mock('@/vault/vault-context', () => ({
  useVault: () => ({ index, commit: 'x', loading: false }),
}))
vi.mock('@/shell/nav', () => ({ useNav: () => ({ open }) }))
vi.mock('@/workspace/workspace-context', () => ({ useWorkspace: () => ({ active: { id: 'ws' } }) }))
vi.mock('./mermaid', () => ({
  Mermaid: ({ code }: { code: string }) => <div data-testid="mermaid">{code}</div>,
}))

const { Markdown } = await import('./markdown')

function renderNote(code: string): {
  container: HTMLElement
  note: NonNullable<ReturnType<typeof index.byCode.get>>
} {
  const note = index.byCode.get(code)!
  const r = render(
    (<Markdown source={displayBody(note.body, note.name)} notePath={note.path} />) as ReactNode,
  )
  return { container: r.container, note }
}

describe('renderizador de Markdown', () => {
  it('separa wikilinks e embeds sem tocar no texto ao redor', () => {
    const parts = splitWikilinks('Ver [[Clientes/C001 - Acme|a Acme]] e ![[login.png]] fim')
    expect(parts.map((p) => p.type)).toEqual(['text', 'link', 'text', 'image', 'text'])
  })

  it('renderiza tabela, checklist, Mermaid e wikilinks da demanda sem perder conteúdo', async () => {
    const { container } = renderNote('AC-D001')
    expect(container.querySelectorAll('table')).toHaveLength(1)
    expect(container.querySelectorAll('tbody tr')).toHaveLength(2)
    expect(container.querySelectorAll('input[type=checkbox]')).toHaveLength(2)
    expect(container.querySelector('input[type=checkbox]:checked')).not.toBeNull()
    expect(screen.getByTestId('mermaid').textContent).toContain('flowchart LR')
    const headings = [...container.querySelectorAll('h2')].map((h) => h.textContent)
    expect(headings).toEqual([
      'Pedido e problema',
      'Resultado esperado',
      'Contexto e evidências',
      'Impacto e risco',
      'Perguntas abertas',
      'Encaminhamento',
    ])
    expect(container.textContent).not.toContain('Auditoria')

    const link = screen.getByRole('button', { name: 'ficha da Acme' })
    link.click()
    expect(open).toHaveBeenCalledWith('n:Clientes/C001 - Acme.md')
  })

  it('mostra link quebrado em vermelho e não renderiza HTML cru', () => {
    const note = index.byCode.get('AC-D002')!
    const { container } = render(
      <Markdown
        source={'Ver [[Nota que não existe]].\n\n<script>alert(1)</script><b>cru</b>'}
        notePath={note.path}
      />,
    )
    expect(screen.getByTitle('Link quebrado: [[Nota que não existe]]')).toBeInTheDocument()
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('b')).toBeNull()
  })

  it('não trata wikilink dentro de código como link', () => {
    const note = index.byCode.get('AC-D002')!
    const { container } = render(
      <Markdown source={'`[[x]]`\n\n```\n[[y]]\n```'} notePath={note.path} />,
    )
    expect(container.querySelectorAll('button')).toHaveLength(0)
    expect(container.textContent).toContain('[[x]]')
    expect(container.textContent).toContain('[[y]]')
  })
})

describe('tabelas com wikilink com rótulo', () => {
  it('não parte a célula na barra do rótulo', async () => {
    const { protectTablePipes } = await import('./to-hast')
    expect(protectTablePipes('| a | [[X|Y]] e mais |')).toBe('| a | [[X\\|Y]] e mais |')
    expect(protectTablePipes('| a | [[X\\|Y]] |')).toBe('| a | [[X\\|Y]] |')
    expect(protectTablePipes('fora [[X|Y]]')).toBe('fora [[X|Y]]')
    const note = index.byCode.get('AC-D002')!
    const { container } = render(
      <Markdown
        source={
          '| Tema | Decisão |\n| --- | --- |\n| Cliente | [[Clientes/C001 - Acme|Acme]], separado de Personal |'
        }
        notePath={note.path}
      />,
    )
    expect(container.querySelector('td:last-child')!.textContent).toBe('Acme, separado de Personal')
  })
})
