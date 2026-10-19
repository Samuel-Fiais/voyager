import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useSession } from '@/auth/session-context'
import { Button } from '@/components/ui/button'
import type { GitHubRepo } from '@/github/client'
import { listBranches } from '@/github/repo'
import { RepoPicker } from '@/screens/repo-picker'
import { useWorkspace } from './workspace-context'

export function AddWorkspace({ onCancel, onDone }: { onCancel?: () => void; onDone?: () => void }) {
  const [repo, setRepo] = useState<GitHubRepo | null>(null)
  if (!repo) {
    return (
      <div>
        <RepoPicker onPick={setRepo} />
        {onCancel && (
          <div className="mx-auto max-w-2xl px-4">
            <Button variant="ghost" onClick={onCancel}>
              Voltar
            </Button>
          </div>
        )}
      </div>
    )
  }
  return <BranchPicker repo={repo} onBack={() => setRepo(null)} onDone={onDone} />
}

function BranchPicker({
  repo,
  onBack,
  onDone,
}: {
  repo: GitHubRepo
  onBack: () => void
  onDone?: () => void
}) {
  const { github } = useSession()
  const { add } = useWorkspace()
  const [busy, setBusy] = useState(false)
  const branches = useQuery({
    queryKey: ['branches', repo.full_name],
    queryFn: () => listBranches(github!, { owner: repo.owner.login, repo: repo.name }),
    enabled: Boolean(github),
  })
  const names = (branches.data ?? []).map((b) => b.name)
  const ordered = [repo.default_branch, ...names.filter((n) => n !== repo.default_branch)]

  async function open(branch: string) {
    setBusy(true)
    await add(repo.owner.login, repo.name, branch)
    onDone?.()
  }

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="pt-4 rule-record">
        <p className="label-caps">Novo workspace · {repo.full_name}</p>
        <h1 className="mt-3 text-title text-strong">Escolha a branch</h1>
        <p className="mt-2 text-faint">
          O Voyager lê e grava só nesta branch. A primeira sincronização baixa o vault inteiro para
          este navegador.
        </p>
        {branches.isPending && (
          <p className="mt-4 label-caps" role="status">
            Carregando branches…
          </p>
        )}
        {branches.isError && (
          <p className="mt-4 border border-nasa px-3 py-2 text-nasa" role="alert">
            {(branches.error as Error).message}
          </p>
        )}
        {branches.isSuccess && (
          <ul className="mt-4 divide-y border" data-testid="branch-list">
            {ordered.map((name) => (
              <li key={name}>
                <button
                  disabled={busy}
                  className="flex w-full items-baseline justify-between px-3 py-2.5 text-left hover:bg-elevated focus-visible:bg-elevated focus-visible:outline-none disabled:opacity-50"
                  onClick={() => open(name)}
                >
                  <span className="font-mono text-strong">{name}</span>
                  {name === repo.default_branch && <span className="label-caps">padrão</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
        <Button variant="ghost" className="mt-4" onClick={onBack} disabled={busy}>
          Outro repositório
        </Button>
      </div>
    </section>
  )
}
