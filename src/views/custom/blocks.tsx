import type { CodeRenderer } from '@/markdown/markdown'
import { Block } from './block'

export const renderBlocks: CodeRenderer = (lang, code) =>
  lang === 'query' || lang === 'chart' || lang === 'kanban' ? (
    <Block lang={lang} code={code} />
  ) : null
