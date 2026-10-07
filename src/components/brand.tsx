import { VoyagerIcon } from '@/components/voyager-icon'

export function Brand({ size = 22 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5 text-strong">
      <VoyagerIcon size={size} />
      <span className="text-[13px] logotype">VOYAGER</span>
    </span>
  )
}
