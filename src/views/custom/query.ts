import { parse as parseYaml } from 'yaml'
import { timeOf } from '@/vault/audit'
import { statusesOf } from '@/vault/contracts'
import { countByTypeAndStatus, queryNotes, type Note, type VaultIndex } from '@/vault/vault-index'

// Consultas das views e dos blocos embutidos (R13): filtro por type, status, cliente e projeto (códigos).

export interface ViewQuery {
  type?: string | string[]
  status?: string | string[]
  /** código do cliente (ex.: C001) */
  client?: string
  /** código do projeto (ex.: AC-P001) */
  project?: string
  text?: string
}

export type GroupBy = 'status' | 'type' | 'client' | 'project' | 'week'

const list = (v: unknown): string[] | undefined =>
  v === undefined || v === null || v === ''
    ? undefined
    : Array.isArray(v)
      ? v.map(String)
      : [String(v)]

export function normalizeQuery(raw: Record<string, unknown>): ViewQuery {
  return {
    type: list(raw.type),
    status: list(raw.status),
    client: raw.client ? String(raw.client) : undefined,
    project: raw.project ? String(raw.project) : undefined,
    text: raw.text ? String(raw.text) : undefined,
  }
}

export function runQuery(index: VaultIndex, q: ViewQuery): Note[] {
  const client = q.client ? index.byCode.get(q.client)?.path : undefined
  const project = q.project ? index.byCode.get(q.project)?.path : undefined
  if ((q.client && !client) || (q.project && !project)) return []
  return queryNotes(index, { type: q.type, status: q.status, client, project, text: q.text })
}

function keyOf(index: VaultIndex, n: Note, by: GroupBy): string {
  switch (by) {
    case 'status':
      return n.status ?? '—'
    case 'type':
      return n.type ?? '—'
    case 'client':
      return n.client ? (index.notes.get(n.client)?.code ?? '—') : '—'
    case 'project':
      return n.project ? (index.notes.get(n.project)?.code ?? '—') : '—'
    case 'week':
      return n.audit.length ? weekKey(new Date(timeOf(n.audit[0]))) : '—'
  }
}

/** Contagem por grupo: status na ordem do contrato, semanas em ordem cronológica, o resto do maior para o menor. */
export function groupCount(
  index: VaultIndex,
  notes: Note[],
  by: GroupBy,
): { key: string; value: number }[] {
  const m = new Map<string, number>()
  for (const n of notes) {
    const k = keyOf(index, n, by)
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  const out = [...m].map(([key, value]) => ({ key, value }))
  if (by === 'status' && notes[0]?.type) {
    const order = statusesOf(index.contracts, notes[0].type)
    const pos = (k: string) => order.indexOf(k) + 1 || 99
    return out.sort((a, b) => pos(a.key) - pos(b.key))
  }
  return by === 'week'
    ? out.sort((a, b) => a.key.localeCompare(b.key))
    : out.sort((a, b) => b.value - a.value || a.key.localeCompare(b.key))
}

/** Semana ISO (segunda a domingo) como `AAAA-Sww`. */
export function weekKey(d: Date): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const day = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - day)
  const year = t.getUTCFullYear()
  const week = Math.ceil(((t.getTime() - Date.UTC(year, 0, 1)) / 86_400_000 + 1) / 7)
  return `${year}-S${String(week).padStart(2, '0')}`
}

function mondayOf(d: Date) {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7))
  return m
}

/** Linhas de auditoria por semana nas últimas `weeks` semanas (a atual é parcial). */
export function weeklyActivity(index: VaultIndex, weeks = 8, now = new Date()) {
  const start = mondayOf(now)
  const out: { key: string; label: string; value: number; partial: boolean }[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const from = new Date(start)
    from.setDate(from.getDate() - i * 7)
    const to = new Date(from)
    to.setDate(to.getDate() + 7)
    const fmt = (x: Date) =>
      `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}`
    const last = new Date(to)
    last.setDate(last.getDate() - 1)
    out.push({
      key: weekKey(from),
      label: `${weekKey(from).slice(5)} · ${fmt(from)}–${fmt(i === 0 ? now : last)}`,
      value: 0,
      partial: i === 0,
    })
  }
  const first = new Date(start)
  first.setDate(first.getDate() - (weeks - 1) * 7)
  for (const n of index.notes.values()) {
    for (const a of n.audit) {
      const t = timeOf(a)
      if (!t || t < first.getTime()) continue
      const k = weekKey(new Date(t))
      const w = out.find((x) => x.key === k)
      if (w) w.value++
    }
  }
  return out
}

/** Registros por type (os maiores primeiro), iguais às contagens do validador. */
export function typeCounts(index: VaultIndex) {
  return [...countByTypeAndStatus(index)]
    .map(([type, byStatus]) => ({
      key: type,
      value: [...byStatus.values()].reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => b.value - a.value || a.key.localeCompare(b.key))
}

/** Corpo de um bloco ```query/```chart/```kanban (YAML ou JSON). */
export function parseBlock(
  source: string,
): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  try {
    const v: unknown = parseYaml(source) ?? {}
    if (typeof v !== 'object' || Array.isArray(v))
      return { ok: false, error: 'O bloco precisa ser um mapa (chave: valor).' }
    return { ok: true, value: v as Record<string, unknown> }
  } catch (e) {
    return { ok: false, error: String((e as Error).message).split('\n')[0] }
  }
}

export const COLUMNS: Record<string, string> = {
  code: 'Código',
  title: 'Título',
  status: 'Status',
  type: 'Tipo',
  client: 'Cliente',
  project: 'Projeto',
  updated: 'Atualizado',
}
