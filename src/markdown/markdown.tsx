import { toJsxRuntime, type Components } from 'hast-util-to-jsx-runtime'
import { useMemo, type ComponentProps, type ReactNode } from 'react'
import { Fragment, jsx, jsxs } from 'react/jsx-runtime'
import { useNav } from '@/shell/nav'
import { noteId } from '@/shell/nav-ids'
import { dirname, join, normpath } from '@/vault/text'
import { resolveWikilink } from '@/vault/validate'
import { useVault } from '@/vault/vault-context'
import { useWorkspace } from '@/workspace/workspace-context'
import { isImagePath, useAttachmentUrl } from './attachments'
import { Mermaid } from './mermaid'
import { EMBED, WIKILINK } from './remark-wikilinks'
import { toHast } from './to-hast'

export type CodeRenderer = (lang: string, code: string) => ReactNode | null

function useResolve(notePath: string) {
  const { index } = useVault()
  return (target: string): string | null => {
    if (!index) return null
    const r = resolveWikilink(target, notePath, index.linkIndex)
    if (!r) return null
    if (r === 'self') return notePath
    return index.files.has(r) ? r : index.files.has(`${r}.md`) ? `${r}.md` : r
  }
}

function WikiLink({
  target,
  notePath,
  children,
}: {
  target: string
  notePath: string
  children: ReactNode
}) {
  const { open } = useNav()
  const { index } = useVault()
  const resolve = useResolve(notePath)
  const path = resolve(target)
  const note = path ? index?.notes.get(path) : null
  if (!path) {
    return (
      <span
        className="text-nasa underline decoration-dashed underline-offset-[3px]"
        title={`Link quebrado: [[${target}]]`}
      >
        {children}
      </span>
    )
  }
  if (!note) return <Attachment path={path}>{children}</Attachment>
  return (
    <button
      type="button"
      className="text-strong underline decoration-faint decoration-1 underline-offset-[3px] hover:decoration-nasa"
      onClick={() => open(noteId(path))}
      title={note.code ? `${note.code} · ${note.title}` : note.title}
      data-wikilink={target}
    >
      {children}
    </button>
  )
}

function Attachment({ path, children }: { path: string; children: ReactNode }) {
  const { active } = useWorkspace()
  const url = useAttachmentUrl(active?.id, path)
  return url ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-strong underline underline-offset-[3px]"
    >
      {children}
    </a>
  ) : (
    <span className="text-secondary">{children}</span>
  )
}

function LocalImage({ path, alt }: { path: string; alt: string }) {
  const { active } = useWorkspace()
  const url = useAttachmentUrl(active?.id, path)
  if (!url) return <span className="label-caps">{alt || path.split('/').pop()}</span>
  return <img src={url} alt={alt} className="max-w-full border" loading="lazy" />
}

function Embed({ target, notePath, alt }: { target: string; notePath: string; alt: string }) {
  const resolve = useResolve(notePath)
  const path = resolve(target)
  if (!path) return <span className="text-nasa">![[{target}]]</span>
  if (isImagePath(path)) return <LocalImage path={path} alt={alt === target ? '' : alt} />
  return (
    <WikiLink target={target} notePath={notePath}>
      {alt}
    </WikiLink>
  )
}

function textOf(node: unknown): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (node && typeof node === 'object' && 'props' in node) {
    return textOf((node as { props: { children?: unknown } }).props.children)
  }
  return ''
}

export function Markdown({
  source,
  notePath,
  renderCode,
}: {
  source: string
  notePath: string
  renderCode?: CodeRenderer
}) {
  const hast = useMemo(() => toHast(source), [source])
  const components: Partial<Components> = {
    a: ({ href = '', children, ...rest }: ComponentProps<'a'>) => {
      if (href.startsWith(WIKILINK)) {
        return (
          <WikiLink target={decodeURIComponent(href.slice(WIKILINK.length))} notePath={notePath}>
            {children}
          </WikiLink>
        )
      }
      if (/^(https?:|mailto:)/.test(href)) {
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
            {children}
          </a>
        )
      }
      if (href.startsWith('#')) return <a href={href}>{children}</a>
      // link Markdown relativo: nota ou anexo do vault
      let decoded = href.split('#')[0]
      try {
        decoded = decodeURIComponent(decoded)
      } catch {
        // mantém
      }
      const target = normpath(join(dirname(notePath), decoded))
      return (
        <WikiLink target={target} notePath={notePath}>
          {children}
        </WikiLink>
      )
    },
    img: ({ src = '', alt = '' }: ComponentProps<'img'>) => {
      const s = String(src)
      if (s.startsWith(EMBED))
        return (
          <Embed target={decodeURIComponent(s.slice(EMBED.length))} notePath={notePath} alt={alt} />
        )
      if (/^https?:/.test(s))
        return (
          <img
            src={s}
            alt={alt}
            className="max-w-full"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        )
      let decoded = s
      try {
        decoded = decodeURIComponent(s)
      } catch {
        // mantém
      }
      return <LocalImage path={normpath(join(dirname(notePath), decoded))} alt={alt} />
    },
    pre: ({ children }: ComponentProps<'pre'>) => {
      const code = Array.isArray(children) ? children[0] : children
      const props = (code as { props?: { className?: string; children?: unknown } })?.props
      const lang = /language-([\w-]+)/.exec(props?.className ?? '')?.[1] ?? ''
      const text = textOf(props?.children).replace(/\n$/, '')
      if (lang === 'mermaid') return <Mermaid code={text} />
      const custom = renderCode?.(lang, text)
      if (custom) return <>{custom}</>
      return (
        <pre className="overflow-x-auto border bg-panel p-3.5 font-mono text-[12.5px] leading-relaxed text-strong">
          <code>{text}</code>
        </pre>
      )
    },
    table: ({ children }: ComponentProps<'table'>) => (
      <div className="overflow-x-auto">
        <table>{children}</table>
      </div>
    ),
  }
  return (
    <div className="prose-vy" data-testid="markdown">
      {toJsxRuntime(hast, { Fragment, jsx, jsxs, components })}
    </div>
  )
}
