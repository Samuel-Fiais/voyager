// Rótulos de apresentação; os valores canônicos do vault permanecem intactos.

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
  sent: 'Enviada',
  expired: 'Expirada',
  reported: 'Relatado',
  investigating: 'Em investigação',
  confirmed: 'Confirmado',
  needs_info: 'Aguarda informações',
  resolved: 'Resolvido',
  duplicate: 'Duplicado',
  not_a_bug: 'Não é defeito',
  cannot_reproduce: 'Não reproduzido',
  reopened: 'Reaberto',
  retired: 'Desativado',
  deprecated: 'Obsoleto',
  open: 'Aberto',
  follow_up_pending: 'Encaminhamentos pendentes',
  delivered: 'Entregue',
  passed: 'Aprovado',
  failed: 'Reprovado',
  not_applicable: 'Não se aplica',
  not_created: 'Não criado',
  merged: 'Integrado',
  pending: 'Pendente',
  not_assessed: 'Não avaliada',
  updated: 'Atualizada',
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

export function statusLabel(status: unknown): string {
  if (
    status === null ||
    status === undefined ||
    status === '' ||
    status === '—' ||
    status === 'None'
  )
    return '—'
  const value = String(status)
  // Status novos continuam identificáveis, sem snake_case na apresentação.
  return (
    STATUS[value] ??
    value.replace(/[_-]+/g, ' ').replace(/^./u, (c) => c.toLocaleUpperCase('pt-BR'))
  )
}

export function isStatusField(field: string): boolean {
  return field === 'status' || field.endsWith('_status')
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
    case 'confirmed':
    case 'open':
    case 'reopened':
      return 'ring'
    case 'ready':
    case 'planning':
    case 'proposed':
    case 'draft':
    case 'planned':
    case 'reported':
    case 'sent':
      return 'ring-faint'
    case 'changes_requested':
    case 'needs_clarification':
    case 'on_hold':
    case 'paused':
    case 'needs_info':
    case 'follow_up_pending':
    case 'pending':
      return 'dashed'
    case 'in_progress':
    case 'investigating':
      return 'half'
    case 'done':
    case 'completed':
    case 'recorded':
    case 'closed':
    case 'superseded':
    case 'archived':
    case 'resolved':
    case 'delivered':
    case 'passed':
    case 'merged':
    case 'updated':
      return 'full-faint'
    case 'blocked':
      return 'red'
    case 'cancelled':
    case 'declined':
    case 'rejected':
    case 'expired':
    case 'retired':
    case 'deprecated':
    case 'duplicate':
    case 'not_a_bug':
    case 'cannot_reproduce':
    case 'failed':
      return 'struck'
    default:
      return 'dot'
  }
}
