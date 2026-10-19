import { typeLabel } from '@/vault/labels'
import type { Note } from '@/vault/vault-index'
import { splitNote } from './note-parts'

// Vínculos nos dois sentidos (R12, contrato de vínculos): a linha entra na seção adequada da nota.

/** Seções onde uma nota guarda links do tipo dado (a primeira que existir na nota). */
const SECTIONS: Record<string, string[]> = {
  task: ['### Tasks'],
  decision: ['### Decisões'],
  implementation_plan: ['### Planos de implementação'],
  business_rule: ['### Regras de negócio'],
  meeting: ['### Reuniões', '## Reuniões'],
  repository: ['### Repositórios', '## Repositórios'],
  demand: ['### Demandas', '## Demandas'],
  project: ['### Projetos', '## Projetos'],
  implementation_record: ['### Implementação'],
  review_record: ['### Revisões'],
  evidence: ['### Evidências', '## Evidências'],
  technical_knowledge: ['### Conhecimento técnico', '## Conhecimento técnico'],
}
const GENERIC = ['## Documentos relacionados', '## Vínculos', '## Fontes e vínculos', '## Fontes']

export function wikilinkTo(note: Pick<Note, 'path' | 'code' | 'title' | 'name'>): string {
  const target = note.path.replace(/\.md$/, '')
  const alias = note.code ? `${note.code} - ${note.title}` : note.title
  return `[[${target}|${alias}]]`
}

/** Linha de lista apontando para `target`, com a natureza da relação quando não é óbvia. */
export function linkLine(
  target: Pick<Note, 'path' | 'code' | 'title' | 'name' | 'type'>,
  nature?: string,
): string {
  return `- ${wikilinkTo(target)}${nature ? ` (${nature})` : target.type ? ` (${typeLabel(target.type).toLowerCase()})` : ''}`
}

/** Acrescenta a linha na seção que corresponde ao type do alvo; cria "## Vínculos" antes da auditoria se não houver. */
export function insertLink(text: string, targetType: string | null, line: string): string {
  const targetPath = line.match(/\[\[([^\]|]+)/)?.[1]
  if (targetPath && text.includes(`[[${targetPath}|`)) return text
  const { head, body, tail } = splitNote(text)
  const headings = [...(SECTIONS[targetType ?? ''] ?? []), ...GENERIC]
  const lines = body.split('\n')
  for (const h of headings) {
    const i = lines.findIndex((l) => l.trim() === h)
    if (i < 0) continue
    const level = h.indexOf(' ')
    let end = i + 1
    while (end < lines.length) {
      const m = lines[end].match(/^(#+) /)
      if (m && m[1].length <= level) break
      end++
    }
    // tira o marcador de lista vazia (ex.: "- _Nenhum registrado._") e insere após o último item
    const section = lines.slice(i + 1, end).filter((l) => !/^- _.*_\s*$/.test(l))
    let last = -1
    section.forEach((l, k) => {
      if (l.startsWith('- ')) last = k
    })
    if (last < 0) {
      while (section.length && !section[section.length - 1].trim()) section.pop()
      section.push('', line, '')
    } else {
      section.splice(last + 1, 0, line)
    }
    if (section[0] !== '') section.unshift('')
    lines.splice(i + 1, end - i - 1, ...section)
    return head + lines.join('\n') + tail
  }
  const b = body.replace(/\s*$/, '')
  return `${head}${b}\n\n## Vínculos\n\n${line}\n\n${tail}`
}
