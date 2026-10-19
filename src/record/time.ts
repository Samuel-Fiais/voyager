// Formatação de instantes e intervalos da auditoria (horário local do navegador).

export function formatWhen(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${mi}`
}

export function formatShort(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Intervalo legível entre dois registros: "+38 min", "+1h05", "+2 d 3 h". */
export function formatGap(ms: number | null): string {
  if (ms === null) return 'início da trajetória'
  const min = Math.round(ms / 60_000)
  if (min <= 0) return 'no mesmo minuto do anterior'
  if (min < 60) return `+${min} min depois do anterior`
  const h = Math.floor(min / 60)
  if (h < 24) return `+${h}h${String(min % 60).padStart(2, '0')} depois do anterior`
  const d = Math.floor(h / 24)
  return `+${d} d${h % 24 ? ` ${h % 24} h` : ''} depois do anterior`
}

export function formatSpan(ms: number): string {
  const min = Math.round(ms / 60_000)
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  if (h < 48) return `${h}h${String(min % 60).padStart(2, '0')}`
  return `${Math.round(h / 24)} dias`
}
