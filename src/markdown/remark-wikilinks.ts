import type { Link, Image, PhrasingContent, Root, Text } from 'mdast'
import { visit, SKIP } from 'unist-util-visit'

// Wikilinks do Obsidian: [[alvo|rótulo]] vira link `wikilink:alvo`; ![[alvo]] vira imagem `embed:alvo`.
// Código (inline e blocos) não é tocado, porque só nós de texto são visitados.

const RX = /(!?)\[\[([^\]\n]+?)\]\]/g

export const WIKILINK = 'wikilink:'
export const EMBED = 'embed:'

export function splitWikilinks(value: string): PhrasingContent[] {
  const out: PhrasingContent[] = []
  let last = 0
  for (const m of value.matchAll(RX)) {
    if (m.index! > last) out.push({ type: 'text', value: value.slice(last, m.index) })
    const [target, ...labelParts] = m[2].split('|')
    const label = labelParts.join('|').trim()
    if (m[1]) {
      const image: Image = {
        type: 'image',
        url: EMBED + encodeURIComponent(target.trim()),
        alt: label || target.trim(),
      }
      out.push(image)
    } else {
      const shown = label || target.trim().split('#')[0].split('/').pop()!.replace(/\.md$/, '')
      const link: Link = {
        type: 'link',
        url: WIKILINK + encodeURIComponent(target.trim()),
        children: [{ type: 'text', value: shown }],
      }
      out.push(link)
    }
    last = m.index! + m[0].length
  }
  if (last < value.length) out.push({ type: 'text', value: value.slice(last) })
  return out
}

export function remarkWikilinks() {
  return (tree: Root) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || index === undefined || !node.value.includes('[[')) return
      const parts = splitWikilinks(node.value)
      if (parts.length === 1 && parts[0].type === 'text') return
      parent.children.splice(index, 1, ...(parts as typeof parent.children))
      return [SKIP, index + parts.length]
    })
  }
}
