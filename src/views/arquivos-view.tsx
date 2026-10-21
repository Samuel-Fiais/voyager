import { useMemo } from 'react'
import { useNav } from '@/shell/nav'
import { noteId } from '@/shell/nav-ids'
import { ViewIcon } from '@/shell/icons'
import { useVault } from '@/vault/vault-context'
import { useWorkspace } from '@/workspace/workspace-context'
import { WorkspaceSummary } from '@/workspace/workspace-summary'
import { Page, SectionHeader, ViewHeader } from './common'
import { Icon } from '@/components/icon'

interface Folder {
  name: string
  path: string
  folders: Map<string, Folder>
  files: string[]
}

function buildTree(paths: string[]): Folder {
  const root: Folder = { name: '', path: '', folders: new Map(), files: [] }
  for (const p of paths) {
    const parts = p.split('/')
    let node = root
    for (const part of parts.slice(0, -1)) {
      let next = node.folders.get(part)
      if (!next) {
        next = {
          name: part,
          path: node.path ? `${node.path}/${part}` : part,
          folders: new Map(),
          files: [],
        }
        node.folders.set(part, next)
      }
      node = next
    }
    node.files.push(p)
  }
  return root
}

function count(f: Folder): number {
  return f.files.length + [...f.folders.values()].reduce((a, c) => a + count(c), 0)
}

const sorted = (m: Map<string, Folder>) =>
  [...m.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

function FileRow({ path }: { path: string }) {
  const { open } = useNav()
  const { index } = useVault()
  const note = index?.notes.get(path)
  const name = path.split('/').pop()!
  if (!note) {
    return <div className="truncate py-1 pl-[92px] text-small text-faint">{name}</div>
  }
  return (
    <button
      className="grid w-full grid-cols-[84px_minmax(0,1fr)] gap-2 py-1 text-left text-ui hover:bg-elevated"
      onClick={() => open(noteId(path))}
    >
      <span className="truncate font-mono text-meta text-strong">{note.code ?? ''}</span>
      <span className="truncate text-secondary">{note.code ? note.title : name}</span>
    </button>
  )
}

function FolderNode({ folder }: { folder: Folder }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center gap-2 py-1.5 text-ui text-secondary hover:text-strong">
        <Icon name="chevron-right" size={12} className="text-faint group-open:rotate-90" />
        <span className="truncate">{folder.name}</span>
        <span className="ml-auto font-mono text-meta text-faint">{count(folder)}</span>
      </summary>
      <div className="ml-3 border-l pl-3">
        {sorted(folder.folders).map((f) => (
          <FolderNode key={f.path} folder={f} />
        ))}
        {[...folder.files].sort().map((p) => (
          <FileRow key={p} path={p} />
        ))}
      </div>
    </details>
  )
}

/** Estrutura de pastas do vault como view própria, fora da navegação do dia a dia. */
export function ArquivosView() {
  const { index } = useVault()
  const { active } = useWorkspace()
  const tree = useMemo(() => (index ? buildTree([...index.files.keys()]) : null), [index])
  if (!tree) return null
  return (
    <Page>
      <ViewHeader
        meta={['View', 'estrutura de pastas do vault', `${active?.repo} · ${active?.branch}`]}
        title="Arquivos do vault"
      />
      <div
        className="grid [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-x-8 gap-y-7"
        data-testid="files"
      >
        {sorted(tree.folders).map((f) => (
          <div key={f.path}>
            <SectionHeader
              title={
                <>
                  <ViewIcon name="arquivos" />
                  {f.name}
                </>
              }
              aside={count(f)}
            />
            {sorted(f.folders).map((sub) => (
              <FolderNode key={sub.path} folder={sub} />
            ))}
            {[...f.files].sort().map((p) => (
              <FileRow key={p} path={p} />
            ))}
          </div>
        ))}
      </div>
      {tree.files.length > 0 && (
        <p className="text-small text-faint">Na raiz: {tree.files.join(', ')}</p>
      )}
      <p className="text-small text-faint">
        As pastas continuam existindo para o Obsidian e os agentes; no Voyager elas ficam nesta
        view.
      </p>
      <WorkspaceSummary />
    </Page>
  )
}
