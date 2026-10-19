import { useMemo } from 'react'
import { useNav } from '@/shell/nav'
import { noteId } from '@/shell/nav-ids'
import { ViewIcon } from '@/shell/icons'
import { useVault } from '@/vault/vault-context'
import { useWorkspace } from '@/workspace/workspace-context'
import { WorkspaceSummary } from '@/workspace/workspace-summary'
import { Page, SectionHeader, ViewHeader } from './common'

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
    return <div className="truncate py-1 pl-[92px] text-[12.5px] text-faint">{name}</div>
  }
  return (
    <button
      className="grid w-full grid-cols-[84px_minmax(0,1fr)] gap-2 py-1 text-left text-[13px] hover:bg-elevated"
      onClick={() => open(noteId(path))}
    >
      <span className="truncate font-mono text-[11px] text-strong">{note.code ?? ''}</span>
      <span className="truncate text-secondary">{note.code ? note.title : name}</span>
    </button>
  )
}

function FolderNode({ folder }: { folder: Folder }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center gap-2 py-1.5 text-[13px] text-secondary hover:text-strong">
        <span className="w-3 text-faint group-open:rotate-90">›</span>
        <span className="truncate">{folder.name}</span>
        <span className="ml-auto font-mono text-[11px] text-faint">{count(folder)}</span>
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
        <p className="text-[12px] text-faint">Na raiz: {tree.files.join(', ')}</p>
      )}
      <p className="text-[12px] text-faint">
        As pastas continuam existindo para o Obsidian e os agentes; no Voyager elas ficam nesta
        view.
      </p>
      <WorkspaceSummary />
    </Page>
  )
}
