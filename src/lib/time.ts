export function formatRelative(iso: string, now = Date.now()) {
  const diff = Math.max(0, now - new Date(iso).getTime())
  const min = Math.round(diff / 60_000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `há ${h} h`
  return `há ${Math.round(h / 24)} d`
}
