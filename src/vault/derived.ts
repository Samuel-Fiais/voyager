import { byCode, queryNotes, type Note, type VaultIndex } from './vault-index'

// Agregados de navegação: projetos com suas tasks, clientes e o que pede atenção.

export interface ProjectSummary {
  note: Note
  tasks: Note[]
  done: number
  review: number
  blocked: number
}

export function projectSummaries(index: VaultIndex): ProjectSummary[] {
  const projects = queryNotes(index, { type: 'project' })
  const tasks = queryNotes(index, { type: 'task' })
  return projects.map((p) => {
    const list = tasks.filter((t) => t.project === p.path).sort(byCode)
    return {
      note: p,
      tasks: list,
      done: list.filter((t) => t.status === 'done').length,
      review: list.filter((t) => t.status === 'in_review').length,
      blocked: list.filter((t) => t.status === 'blocked').length,
    }
  })
}

export interface ClientSummary {
  note: Note
  /** iniciais usadas nos códigos (alias curto em maiúsculas), quando houver */
  prefix: string | null
}

export function clientSummaries(index: VaultIndex): ClientSummary[] {
  return queryNotes(index, { type: ['company', 'individual'] }).map((note) => {
    const aliases = Array.isArray(note.data.aliases) ? note.data.aliases.map(String) : []
    const prefix = aliases.find((a) => /^[A-Z][A-Z0-9]{1,4}$/.test(a)) ?? null
    return { note, prefix }
  })
}

const OPEN_DEMAND = new Set(['discovered', 'needs_clarification'])

export function attention(index: VaultIndex) {
  const tasks = queryNotes(index, { type: 'task' })
  return {
    blocked: tasks.filter((t) => t.status === 'blocked').length,
    review: tasks.filter((t) => t.status === 'in_review').length,
    changes: tasks.filter((t) => t.status === 'changes_requested').length,
    done: tasks.filter((t) => t.status === 'done').length,
    openDemands: queryNotes(index, { type: 'demand' }).filter(
      (d) => d.status && OPEN_DEMAND.has(d.status),
    ),
  }
}
