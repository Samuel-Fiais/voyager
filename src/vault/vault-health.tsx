import { useMemo } from 'react'
import { statusesOf } from './contracts'
import { useVault } from './vault-context'
import { countByTypeAndStatus } from './vault-index'

// Saúde do vault (W04): contagens por type e status lidas do índice, status fora do contrato e links quebrados.
export function VaultHealth() {
  const { index, loading } = useVault()
  const counts = useMemo(() => (index ? countByTypeAndStatus(index) : null), [index])
  if (!index || !counts) {
    return (
      <p className="mt-6 label-caps" role="status">
        {loading ? 'Montando o índice…' : 'Índice disponível após a sincronização.'}
      </p>
    )
  }
  const types = [...counts.keys()].sort()
  return (
    <div className="mt-10 grid gap-10" data-testid="vault-health">
      <section>
        <h2 className="pb-2 label-caps text-strong rule-section">Registros por type e status</h2>
        <table className="mt-3 w-full text-left text-label">
          <thead>
            <tr className="border-b">
              <th className="py-1.5 pr-3 label-caps">Type</th>
              <th className="py-1.5 pr-3 text-right label-caps">Total</th>
              <th className="py-1.5 label-caps">Status</th>
            </tr>
          </thead>
          <tbody>
            {types.map((t) => {
              const byStatus = counts.get(t)!
              const total = [...byStatus.values()].reduce((a, b) => a + b, 0)
              const order = statusesOf(index.contracts, t)
              const allowed = index.contracts.allowed.get(t)
              const entries = [...byStatus.entries()].sort(
                ([a], [b]) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99),
              )
              return (
                <tr key={t} className="border-b align-top" data-testid={`type-${t}`}>
                  <td className="py-1.5 pr-3 font-mono text-strong">{t}</td>
                  <td className="py-1.5 pr-3 text-right font-mono">{total}</td>
                  <td className="py-1.5">
                    {entries.map(([s, n]) => (
                      <span
                        key={s}
                        className={
                          allowed?.has(s) ? 'mr-3 inline-block' : 'mr-3 inline-block text-nasa'
                        }
                        title={allowed?.has(s) ? undefined : 'fora do contrato'}
                      >
                        <span className="font-mono">{s}</span> {n}
                      </span>
                    ))}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
      <section>
        <h2 className="pb-2 label-caps text-strong rule-section">
          Links quebrados · <span data-testid="broken-count">{index.brokenLinks.length}</span>
        </h2>
        {index.brokenLinks.length === 0 ? (
          <p className="mt-3 text-faint">Nenhum link quebrado.</p>
        ) : (
          <ul className="mt-3 divide-y border" data-testid="broken-links">
            {index.brokenLinks.map((b, i) => (
              <li key={i} className="px-3 py-2 text-label">
                <span className="font-mono text-strong">[[{b.target}]]</span>
                <span className="block text-faint">{b.from}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
