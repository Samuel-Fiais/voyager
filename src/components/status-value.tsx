import { statusLabel } from '@/vault/labels'
import { StatusGlyph } from './status-glyph'

/** Apresentação de status em propriedades, listas e tabelas. */
export function StatusValue({ status }: { status: unknown }) {
  const label = statusLabel(status)
  return (
    <span className="inline-flex min-w-0 items-center gap-2 text-small">
      {label !== '—' && <StatusGlyph status={String(status)} size={11} />}
      <span>{label}</span>
    </span>
  )
}
