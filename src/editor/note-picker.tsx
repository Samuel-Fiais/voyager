import { useMemo, useState } from 'react'
import { StatusGlyph } from '@/components/status-glyph'
import { foldText } from '@/lib/text'
import { cn } from '@/lib/utils'
import { typeLabel } from '@/vault/labels'
import { useVault } from '@/vault/vault-context'
import { byCode, type Note } from '@/vault/vault-index'

/** Escolha de uma nota por código ou título (sem acento), com filtro opcional. */
export function NotePicker({
  value,
  onChange,
  filter,
  placeholder = 'Buscar por código ou título',
  testId,
}: {
  value: Note | null
  onChange: (note: Note | null) => void
  filter?: (note: Note) => boolean
  placeholder?: string
  testId?: string
}) {
  const { index } = useVault()
  const [q, setQ] = useState('')
  const items = useMemo(() => {
    if (!index) return []
    const words = foldText(q).split(/\s+/).filter(Boolean)
    return [...index.notes.values()]
      .filter((n) => n.code && (!filter || filter(n)) && words.every((w) => n.search.includes(w)))
      .sort(byCode)
      .slice(0, 8)
  }, [index, q, filter])
  if (value) {
    return (
      <div className="flex items-center gap-2 border bg-bg px-3 py-2" data-testid={testId}>
        <StatusGlyph status={value.status} size={11} />
        <span className="font-mono text-[12px] text-strong">{value.code}</span>
        <span className="truncate text-secondary">{value.title}</span>
        <button
          className="ml-auto text-faint hover:text-strong"
          onClick={() => onChange(null)}
          aria-label="Trocar"
        >
          ×
        </button>
      </div>
    )
  }
  return (
    <div className="grid border bg-bg" data-testid={testId}>
      <input
        className="bg-transparent px-3 py-2 text-[14px] text-strong outline-none placeholder:text-faint"
        placeholder={placeholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label={placeholder}
      />
      {q && (
        <ul className="max-h-[220px] overflow-y-auto border-t" role="listbox">
          {items.map((n) => (
            <li key={n.path}>
              <button
                role="option"
                aria-selected={false}
                className={cn(
                  'grid w-full grid-cols-[14px_96px_minmax(0,1fr)_auto] items-center gap-2 px-3 py-1.5 text-left text-[13px] hover:bg-panel',
                )}
                onClick={() => onChange(n)}
              >
                <StatusGlyph status={n.status} size={10} />
                <span className="truncate font-mono text-[11.5px] text-strong">{n.code}</span>
                <span className="truncate text-secondary">{n.title}</span>
                <small className="text-[10.5px] text-faint uppercase">{typeLabel(n.type)}</small>
              </button>
            </li>
          ))}
          {!items.length && <li className="px-3 py-2 text-[13px] text-faint">Nada encontrado.</li>}
        </ul>
      )}
    </div>
  )
}
