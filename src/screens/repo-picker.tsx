import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useSession } from '@/auth/session-context'
import type { GitHubRepo } from '@/github/client'
import { foldText } from '@/lib/text'

export function RepoPicker({ onPick }: { onPick: (repo: GitHubRepo) => void }) {
  const { github, session } = useSession()
  const [filter, setFilter] = useState('')
  const repos = useQuery({
    queryKey: ['repos', session?.login],
    queryFn: () => github!.repos(),
    enabled: Boolean(github),
    staleTime: 60_000,
  })
  const visible = useMemo(() => {
    const f = foldText(filter)
    return (repos.data ?? []).filter((r) => !f || foldText(r.full_name).includes(f))
  }, [repos.data, filter])

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="pt-4 rule-record">
        <p className="label-caps">Novo workspace</p>
        <h1 className="mt-3 text-title text-strong">Escolha o repositório do vault</h1>
        <input
          className="mt-5 h-9 w-full border bg-elevated px-3 text-strong outline-none placeholder:text-faint focus:border-strong"
          placeholder="Filtrar repositórios"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filtrar repositórios"
        />
        {repos.isPending && (
          <p className="mt-4 label-caps" role="status">
            Carregando repositórios…
          </p>
        )}
        {repos.isError && (
          <p className="mt-4 border border-nasa px-3 py-2 text-nasa" role="alert">
            Não foi possível listar os repositórios: {(repos.error as Error).message}
          </p>
        )}
        <ul className="mt-4 divide-y border" data-testid="repo-list">
          {visible.map((r) => (
            <li key={r.id}>
              <button
                className="flex w-full items-baseline justify-between gap-3 px-3 py-2.5 text-left hover:bg-elevated focus-visible:bg-elevated focus-visible:outline-none"
                onClick={() => onPick(r)}
              >
                <span className="min-w-0 truncate text-strong">{r.full_name}</span>
                <span className="shrink-0 label-caps">
                  {r.private ? 'privado' : 'público'} · {r.default_branch}
                </span>
              </button>
            </li>
          ))}
          {repos.isSuccess && visible.length === 0 && (
            <li className="px-3 py-2.5 text-faint">Nenhum repositório encontrado.</li>
          )}
        </ul>
      </div>
    </section>
  )
}
