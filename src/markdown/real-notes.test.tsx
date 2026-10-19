import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { loadFixtureVault } from '../../testing/fixture-vault'
import { toVaultFiles } from '../../testing/vault-files'
import { buildVaultIndex } from '@/vault/vault-index'
import { displayBody } from './note-body'
import { protectTablePipes, toHast } from './to-hast'

// Conferência com notas reais: VOYAGER_KB_DIR=/caminho/do/knowledge-base npx vitest run real-notes
const KB = process.env.VOYAGER_KB_DIR
const index = KB ? buildVaultIndex(toVaultFiles(loadFixtureVault(KB))) : null

vi.mock('@/vault/vault-context', () => ({
  useVault: () => ({ index, commit: 'x', loading: false }),
}))
vi.mock('@/shell/nav', () => ({ useNav: () => ({ open: () => undefined }) }))
vi.mock('@/workspace/workspace-context', () => ({ useWorkspace: () => ({ active: { id: 'ws' } }) }))
vi.mock('./mermaid', () => ({
  Mermaid: ({ code }: { code: string }) => <pre data-mermaid>{code}</pre>,
}))

const { Markdown } = await import('./markdown')

function count(hast: ReturnType<typeof toHast>, tag: string): number {
  let n = 0
  const walk = (node: { type: string; tagName?: string; children?: unknown[] }) => {
    if (node.type === 'element' && node.tagName === tag) n++
    for (const c of node.children ?? []) walk(c as never)
  }
  walk(hast as never)
  return n
}

const plain = (s: string) => s.replace(/\s+/g, ' ').trim()

describe.runIf(KB)('notas reais renderizam sem perder conteúdo', () => {
  for (const code of ['VO-D001', 'NG-T035', 'VO-P001', 'NG-P001']) {
    it(code, () => {
      const note = index!.byCode.get(code)
      if (!note) return
      const source = protectTablePipes(displayBody(note.body, note.name))
      const hast = toHast(source)
      const { container } = render(<Markdown source={source} notePath={note.path} />)
      for (const tag of ['h2', 'h3', 'table', 'tr', 'li', 'pre', 'blockquote']) {
        expect(
          container.querySelectorAll(`[data-testid=markdown] ${tag}`).length,
          `${code} <${tag}>`,
        ).toBe(count(hast, tag))
      }
      // cada linha de texto da fonte (sem marcação) aparece no DOM
      const text = plain(container.textContent ?? '')
      const words = source
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/\]\([^)]*\)/g, ']')
        .replace(/!?\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
        .replace(/!?\[\[([^\]]+)\]\]/g, (_, t: string) => t.split('/').pop()!.replace(/\.md$/, ''))
        .replace(/[*_`#>|]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 4 && !/^[-:]+$/.test(w) && !w.startsWith('http'))
      const missing = words
        .map((w) => w.replace(/\]\(.*$/, '').replace(/^[[("']+|[\]).,;:!?"']+$/g, ''))
        .filter((w) => w.length > 4 && !text.includes(w))
      expect(missing.slice(0, 10), `${code}: palavras ausentes`).toEqual([])
      console.log(
        `${code}: ${count(hast, 'h2')} seções, ${count(hast, 'table')} tabelas, ${count(hast, 'li')} itens, ${words.length} palavras conferidas`,
      )
    })
  }
})
