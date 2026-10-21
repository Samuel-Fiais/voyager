import { Icon, type IconName } from '@/components/icon'

export function ViewIcon({
  name,
}: {
  name: Extract<IconName, 'painel' | 'kanban' | 'demandas' | 'arquivos'>
}) {
  return <Icon name={name} />
}
