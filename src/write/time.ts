/** Instante ISO 8601 com o fuso local do navegador e segundos (contrato de auditoria). */
export function nowISO(date = new Date()): string {
  const pad = (n: number) => String(Math.abs(n)).padStart(2, '0')
  const off = -date.getTimezoneOffset()
  const sign = off >= 0 ? '+' : '-'
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`
  )
}
