// Rótulos em português dos status e types mais comuns; o valor cru aparece quando não há rótulo.

const STATUS: Record<string, string> = {
  planned: 'Planejada',
  ready: 'Pronta',
  in_progress: 'Em andamento',
  in_review: 'Em revisão',
  changes_requested: 'Ajustes pedidos',
  blocked: 'Bloqueada',
  done: 'Concluída',
  cancelled: 'Cancelada',
  discovered: 'Descoberta',
  needs_clarification: 'Precisa de esclarecimento',
  declined: 'Recusada',
  planning: 'Em planejamento',
  active: 'Ativo',
  on_hold: 'Pausado',
  completed: 'Concluído',
  potential: 'Potencial',
  paused: 'Pausado',
  closed: 'Encerrado',
  draft: 'Rascunho',
  approved: 'Aprovado',
  superseded: 'Substituído',
  proposed: 'Proposto',
  accepted: 'Aceita',
  rejected: 'Rejeitada',
  recorded: 'Registrado',
  archived: 'Arquivado',
}

const TYPE: Record<string, string> = {
  task: 'Task',
  demand: 'Demanda',
  project: 'Projeto',
  company: 'Cliente',
  individual: 'Cliente',
  repository: 'Repositório',
  implementation_plan: 'Plano',
  decision: 'Decisão',
  bug: 'Bug',
  meeting: 'Reunião',
  implementation_record: 'Implementação',
  review_record: 'Revisão',
  evidence: 'Evidência',
  technical_knowledge: 'Conhecimento técnico',
  vocabulary_term: 'Vocabulário',
  commercial_proposal: 'Proposta',
  architecture: 'Arquitetura',
  design_system: 'Padrão de interface',
  domain: 'Domínio',
  domain_entity: 'Entidade',
  procedure: 'Procedimento',
  business_rule: 'Regra',
}

export function statusLabel(status: string | null | undefined) {
  if (!status) return '—'
  return STATUS[status] ?? status
}

export function typeLabel(type: string | null | undefined) {
  if (!type) return 'Nota'
  return TYPE[type] ?? type
}

/** Forma do glifo de status (VO-DS001): status não usa cor, só forma; bloqueado é vermelho. */
export type GlyphShape =
  'ring' | 'ring-faint' | 'dashed' | 'half' | 'full-faint' | 'red' | 'struck' | 'dot'

export function glyphShape(status: string | null | undefined): GlyphShape {
  switch (status) {
    case 'in_review':
    case 'active':
    case 'accepted':
    case 'approved':
      return 'ring'
    case 'ready':
    case 'planning':
    case 'proposed':
    case 'draft':
      return 'ring-faint'
    case 'changes_requested':
    case 'needs_clarification':
    case 'on_hold':
    case 'paused':
      return 'dashed'
    case 'in_progress':
      return 'half'
    case 'done':
    case 'completed':
    case 'recorded':
    case 'closed':
    case 'superseded':
    case 'archived':
      return 'full-faint'
    case 'blocked':
      return 'red'
    case 'cancelled':
    case 'declined':
    case 'rejected':
      return 'struck'
    default:
      return 'dot'
  }
}
