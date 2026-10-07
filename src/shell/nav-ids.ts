// Ids de navegação do shell.

export const VIEWS = ['painel', 'kanban', 'demandas', 'arquivos'] as const
export type ViewId = (typeof VIEWS)[number]
export const VIEW_LABEL: Record<ViewId, string> = {
  painel: 'Painel',
  kanban: 'Kanban de tasks',
  demandas: 'Demandas',
  arquivos: 'Arquivos do vault',
}

/** Id de navegação: uma view ou `n:<caminho da nota>`. */
export type NavId = string

export const noteId = (path: string) => `n:${path}`
export const isView = (id: NavId): id is ViewId => (VIEWS as readonly string[]).includes(id)
export const notePathOf = (id: NavId) => (id.startsWith('n:') ? id.slice(2) : null)
