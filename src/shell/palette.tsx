import { useEffect, useMemo, useRef, useState } from 'react'
import { StatusGlyph } from '@/components/status-glyph'
import { foldText } from '@/lib/text'
import { cn } from '@/lib/utils'
import { typeLabel } from '@/vault/labels'
import { useVault } from '@/vault/vault-context'
import { byCode } from '@/vault/vault-index'
import { noteId, VIEW_LABEL, VIEWS, type NavId } from './nav-ids'
import { useNav } from './nav'

interface Item {
  id: NavId
  code: string
  title: string
  kind: string
  status: string | null
  search: string
}

/** Busca (⌘K/Ctrl+K) por código e título, sem acento. */
export function Palette() {
  const { paletteOpen, setPaletteOpen } = useNav()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(!paletteOpen)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [paletteOpen, setPaletteOpen])

  return paletteOpen ? <PaletteDialog /> : null
}

function PaletteDialog() {
  const { setPaletteOpen, open } = useNav()
  const { index } = useVault()
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    input.current?.focus()
  }, [])

  const all = useMemo<Item[]>(() => {
    const views: Item[] = VIEWS.map((v) => ({
      id: v,
      code: 'VIEW',
      title: VIEW_LABEL[v],
      kind: 'view',
      status: null,
      search: foldText(`view ${VIEW_LABEL[v]}`),
    }))
    const notes: Item[] = index
      ? [...index.notes.values()]
          .filter((n) => n.code)
          .sort(byCode)
          .map((n) => ({
            id: noteId(n.path),
            code: n.code!,
            title: n.title,
            kind: typeLabel(n.type).toLowerCase(),
            status: n.status,
            search: n.search,
          }))
      : []
    return [...views, ...notes]
  }, [index])

  const items = useMemo(() => {
    const f = foldText(q)
    if (!f) return all.slice(0, 12)
    const words = f.split(/\s+/)
    const hits = all.filter((x) => words.every((w) => x.search.includes(w)))
    // código que começa com o termo vem primeiro
    return hits
      .sort(
        (a, b) => Number(!foldText(a.code).startsWith(f)) - Number(!foldText(b.code).startsWith(f)),
      )
      .slice(0, 30)
  }, [all, q])

  const sel = Math.min(idx, Math.max(items.length - 1, 0))

  return (
    <div
      className="fixed inset-0 z-40 grid items-start justify-items-center bg-black/50 px-4 pt-[70px]"
      onMouseDown={(e) => e.target === e.currentTarget && setPaletteOpen(false)}
    >
      <div
        className="w-full max-w-[640px] border border-strong bg-elevated shadow-layer"
        role="dialog"
        aria-label="Buscar"
      >
        <input
          ref={input}
          className="w-full border-b-2 border-strong bg-transparent px-[18px] py-4 text-[17px] text-strong outline-none placeholder:text-faint"
          placeholder="Buscar por código ou título"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setIdx(0)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setIdx(Math.min(items.length - 1, sel + 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setIdx(Math.max(0, sel - 1))
            } else if (e.key === 'Enter' && items[sel]) {
              e.preventDefault()
              open(items[sel].id)
            } else if (e.key === 'Escape') setPaletteOpen(false)
          }}
          aria-label="Buscar"
          aria-controls="palette-list"
          data-testid="palette-input"
        />
        {items.length ? (
          <ul
            id="palette-list"
            role="listbox"
            className="max-h-[380px] overflow-y-auto py-1.5"
            data-testid="palette-list"
          >
            {items.map((x, i) => (
              <li key={x.id}>
                <button
                  role="option"
                  aria-selected={i === sel}
                  className={cn(
                    'grid w-full grid-cols-[16px_86px_minmax(0,1fr)_auto] items-center gap-3 px-[18px] py-[9px] text-left text-sm',
                    i === sel && 'bg-panel shadow-[inset_3px_0_0_var(--vy-nasa)]',
                  )}
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => open(x.id)}
                >
                  <StatusGlyph status={x.status} size={11} />
                  <span className="truncate font-mono text-[11.5px] text-secondary">{x.code}</span>
                  <span className="truncate text-strong">{x.title}</span>
                  <small className="text-[11px] font-semibold tracking-[0.06em] text-faint uppercase">
                    {x.kind}
                  </small>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-[18px] text-[13.5px] text-faint">Nada encontrado para "{q}".</div>
        )}
        <div className="flex gap-4 border-t px-[18px] py-[9px] text-[11.5px] text-faint">
          <span>↑↓ navegar</span>
          <span>Enter abrir</span>
          <span>Esc fechar</span>
        </div>
      </div>
    </div>
  )
}
