import { authorizeUrl, clientId } from '@/auth/session'
import { Brand } from '@/components/brand'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'

export function Login({ error }: { error?: string }) {
  const configured = Boolean(clientId())
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-12 items-center justify-between border-b bg-panel px-4">
        <Brand />
        <ThemeToggle />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
        <div className="pt-4 rule-record">
          <p className="label-caps">Entrada</p>
          <h1 className="mt-3 text-title text-strong">Operar o vault fora do Obsidian</h1>
          <p className="mt-3">
            Entre com o GitHub para escolher um vault, sincronizar uma cópia no navegador e
            trabalhar com commit e auditoria.
          </p>
          {error && (
            <p role="alert" className="mt-4 border border-nasa px-3 py-2 text-nasa">
              {error}
            </p>
          )}
          {!configured && (
            <p role="alert" className="mt-4 border px-3 py-2 text-label text-faint">
              VITE_GITHUB_CLIENT_ID não configurado (ver .env.example).
            </p>
          )}
          <Button
            className="mt-6 h-10 w-full"
            disabled={!configured}
            onClick={() => window.location.assign(authorizeUrl())}
            data-testid="login"
          >
            Entrar com o GitHub
          </Button>
          <p className="mt-3 text-label text-faint">
            Pede o escopo <span className="font-mono">repo</span>. O Voyager só lê e grava nos
            repositórios que você escolher como workspace.
          </p>
        </div>
      </main>
    </div>
  )
}
