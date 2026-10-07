import type { ReactNode } from 'react'
import { Brand } from '@/components/brand'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/theme/use-theme'

// Referência viva dos tokens do VO-DS001 nos dois temas (rota /design), criada na VO-T001.

const COLORS = [
  { token: 'bg', role: 'Fundo', use: 'área de conteúdo' },
  { token: 'panel', role: 'Painel', use: 'topo, sidebar, painel direito' },
  { token: 'elevated', role: 'Elevado', use: 'cards, menus, folhas' },
  { token: 'line', role: 'Linha', use: 'divisórias de 1px' },
  { token: 'strong', role: 'Forte', use: 'réguas grossas, texto principal' },
  { token: 'secondary', role: 'Texto secundário', use: 'corpo de texto e metadados' },
  { token: 'faint', role: 'Texto apagado', use: 'rótulos, horários' },
  { token: 'orbit', role: 'Órbita', use: 'trecho tracejado das trajetórias' },
  { token: 'nasa', role: 'Vermelho NASA', use: 'ação que grava e status bloqueado' },
] as const

const RULES = [
  { name: 'Registro', width: 'var(--rule-record)', use: 'topo do cabeçalho de registro' },
  { name: 'Coluna', width: 'var(--rule-column)', use: 'topo de colunas do kanban e indicadores' },
  { name: 'Seção', width: 'var(--rule-section)', use: 'sob títulos de seção' },
  { name: 'Fio', width: 'var(--rule-hair)', use: 'demais divisórias' },
] as const

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="pb-2 label-caps text-strong rule-section">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

export function DesignTokens() {
  const { theme } = useTheme()

  return (
    <div className="min-h-dvh">
      <header className="flex h-12 items-center justify-between border-b bg-panel px-4">
        <Brand />
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-10 pb-20 sm:px-8">
        <article className="pt-4 rule-record">
          <p className="label-caps">
            Padrão de interface · Voyager · tema {theme === 'dark' ? 'escuro' : 'claro'}
          </p>
          <p className="mt-3 font-mono text-code tracking-tight text-strong">VO-DS001</p>
          <h1 className="mt-2 text-title text-strong">Tokens de design</h1>
          <p className="mt-4 measure">
            Identidade do Manual de Normas Gráficas da NASA com o detalhe espacial das trajetórias.
            Sem raios, réguas grossas, Archivo no texto e JetBrains Mono em códigos e horários.
          </p>
        </article>

        <Section title="Cores">
          <ul className="grid grid-cols-1 gap-px border bg-line sm:grid-cols-3">
            {COLORS.map((c) => (
              <li key={c.token} className="bg-bg p-3" data-testid={`swatch-${c.token}`}>
                <div className="h-12 border" style={{ background: `var(--vy-${c.token})` }} />
                <p className="mt-2 text-strong">{c.role}</p>
                <p className="font-mono text-label tracking-normal text-faint">--vy-{c.token}</p>
                <p className="text-label text-faint">{c.use}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Tipografia">
          <dl className="grid gap-6">
            <div>
              <dt className="label-caps">Código do registro · 56px · 800 · mono</dt>
              <dd className="font-mono text-code text-strong">NG-T035</dd>
            </div>
            <div>
              <dt className="label-caps">Título da nota · 24px · 500</dt>
              <dd className="text-title text-strong">
                Sistema web para operar o vault fora do Obsidian
              </dd>
            </div>
            <div>
              <dt className="label-caps">Corpo · 15px · entrelinha 1,7 · 70 caracteres</dt>
              <dd className="measure">
                Samuel entra com o GitHub, escolhe um vault, sincroniza uma cópia no navegador e
                opera o vault sem o Obsidian, com cada alteração gravada por commit e auditoria.
              </dd>
            </div>
            <div>
              <dt className="label-caps">Rótulo · 11px · caixa alta · 0,08em</dt>
              <dd className="label-caps">Em revisão · 2026-10-07 00:02</dd>
            </div>
            <div>
              <dt className="label-caps">Logotipo · Archivo larga 125%</dt>
              <dd className="text-title logotype text-strong">VOYAGER</dd>
            </div>
          </dl>
        </Section>

        <Section title="Réguas">
          <ul className="grid gap-5">
            {RULES.map((r) => (
              <li key={r.name}>
                <div style={{ borderTop: `${r.width} solid var(--vy-strong)` }} />
                <p className="mt-1.5 label-caps">
                  {r.name} · {r.use}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Ações">
          <div className="flex flex-wrap gap-3">
            <Button>Abrir</Button>
            <Button variant="ghost">Cancelar</Button>
            <Button variant="commit">Confirmar e commitar</Button>
          </div>
          <p className="mt-3 text-label text-faint">
            O vermelho aparece só em ação que grava no repositório e em bloqueio.
          </p>
        </Section>
      </main>
    </div>
  )
}
