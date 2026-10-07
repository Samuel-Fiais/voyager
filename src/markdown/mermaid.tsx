import { useEffect, useId, useState } from 'react'
import { useTheme } from '@/theme/use-theme'

/** Diagrama Mermaid, carregado sob demanda; em erro mostra o código cru. */
export function Mermaid({ code }: { code: string }) {
  const { theme } = useTheme()
  const id = `mmd-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const [state, setState] = useState<{ key: string; svg?: string; error?: string } | null>(null)
  const key = `${theme}|${code}`

  useEffect(() => {
    let cancelled = false
    import('mermaid')
      .then(async ({ default: mermaid }) => {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: theme === 'dark' ? 'dark' : 'neutral',
          fontFamily: 'Archivo Variable, sans-serif',
        })
        const { svg } = await mermaid.render(id, code)
        if (!cancelled) setState({ key, svg })
      })
      .catch((e: unknown) => {
        if (!cancelled) setState({ key, error: e instanceof Error ? e.message : String(e) })
      })
    return () => {
      cancelled = true
    }
  }, [code, theme, id, key])

  const current = state?.key === key ? state : null
  if (current?.svg) {
    return (
      <div
        className="overflow-x-auto border bg-panel p-4 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
        data-testid="mermaid"
        // SVG gerado pelo Mermaid com securityLevel strict (sem HTML nem scripts do autor).
        dangerouslySetInnerHTML={{ __html: current.svg }}
      />
    )
  }
  return (
    <div className="border bg-panel">
      <p className="border-b px-3 py-1.5 label-caps">
        {current?.error
          ? `Mermaid inválido: ${current.error.split('\n')[0]}`
          : 'Desenhando o diagrama…'}
      </p>
      <pre className="overflow-x-auto p-3 font-mono text-[12px] text-secondary">{code}</pre>
    </div>
  )
}
