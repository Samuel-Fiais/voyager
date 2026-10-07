import type { Root as HastRoot } from 'hast'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { remarkWikilinks } from './remark-wikilinks'

// Markdown do vault (GFM + wikilinks) para HAST. HTML cru do autor não é renderizado.
const processor = unified().use(remarkParse).use(remarkGfm).use(remarkWikilinks).use(remarkRehype)

/**
 * Em linhas de tabela, a barra do rótulo de um wikilink ([[alvo|rótulo]]) sem escape partiria a célula
 * e o GFM descartaria o resto da linha. Escapa essas barras antes de interpretar.
 */
export function protectTablePipes(source: string): string {
  return source
    .split('\n')
    .map((line) =>
      line.trimStart().startsWith('|')
        ? line.replace(/\[\[([^\]\n]*?)\]\]/g, (m) => m.replace(/(?<!\\)\|/g, '\\|'))
        : line,
    )
    .join('\n')
}

export function toHast(source: string): HastRoot {
  return processor.runSync(processor.parse(protectTablePipes(source))) as HastRoot
}
