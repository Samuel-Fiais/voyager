# Voyager

App web para operar vaults Markdown versionados no GitHub sem o Obsidian: entrar com o GitHub, abrir um vault como workspace, sincronizar uma cópia no navegador, ler, mover tasks, editar e criar notas, com cada alteração gravada por commit e auditoria.

Projeto VO-P001 (plano VO-IP001). Padrão de interface: VO-DS001 (ver `DESIGN.md`). Arquitetura: VO-ARQ001.

## O que o Voyager faz

- **Entrar** com o GitHub (OAuth App, escopo `repo`) e escolher um vault: repositório + branch = workspace (`docs/oauth.md`).
- **Sincronizar** uma cópia do vault no navegador (IndexedDB), manual e a cada intervalo, só com o que mudou; `.obsidian` e `.trash` ficam fora.
- **Ler** notas com GFM, wikilinks, Mermaid e anexos; páginas de registro com propriedades, links, backlinks e a auditoria como trajetória.
- **Navegar** por entidade (views, projetos, clientes, recentes), abas e busca ⌘K; Arquivos do vault como view.
- **Mover** tasks no kanban (arrastar, ⋯ ou teclado) e mudar status pelo menu, seguindo os contratos do vault.
- **Editar e criar** notas (templates das Skills, próximo código livre, vínculos nos dois sentidos, anexos).
- **Painel**, views versionadas em `.voyager/views/` e blocos ` ```query `, ` ```chart ` e ` ```kanban ` nas notas.
- **Celular**: item por tela, deslize e navegação inferior.

Toda gravação é um commit direto na branch do workspace, com a auditoria do contrato (`… | Samuel Fiais | … (via Voyager)`), validação equivalente ao `validar-vault.py` e detecção de conflito; nunca force-push.

## Desenvolvimento

Requer Node 22 (`.nvmrc`). Copie `.env.example` para `.env.local` e preencha o secret do OAuth App (ver `docs/oauth.md`).

```bash
npm install
npm run dev          # 0.0.0.0:7054 → https://7054.development.ngtools.com.br
```

| Comando                           | O que faz                                                                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                     | Servidor de desenvolvimento em `0.0.0.0:7054` (porta fixa; a Callback URL do OAuth App de desenvolvimento aponta para ela).           |
| `npm run build`                   | Checagem de tipos e build de produção em `dist/`.                                                                                     |
| `npm run lint`                    | ESLint.                                                                                                                               |
| `npm run format` / `format:check` | Prettier (com ordenação das classes Tailwind).                                                                                        |
| `npm run typecheck`               | `tsc -b`.                                                                                                                             |
| `npm test`                        | Vitest (unidade, jsdom).                                                                                                              |
| `npm run check:secrets`           | Compila com um secret sentinela e falha se ele aparecer em `dist/`.                                                                   |
| `npm run test:e2e`                | Playwright em desktop e celular (390px), sobre o build servido em `0.0.0.0:7055`. Na primeira vez: `npx playwright install chromium`. |

## Portas

O ambiente de desenvolvimento só libera a faixa 7050–7059, em `0.0.0.0`, acessada por `https://<porta>.development.ngtools.com.br`. O Voyager usa **7054** (dev) e **7055** (preview e Playwright); 7050–7053 são do App Field. O Vite aceita os hosts `.development.ngtools.com.br`.

## Stack

Vite, React e TypeScript; Tailwind CSS v4 e shadcn/ui (`components.json`); Archivo e JetBrains Mono servidas pelo próprio app (Fontsource). Versões fixadas em `package.json` (`.npmrc` com `save-exact`).

## Tokens de design (VO-DS001)

Os tokens ficam em `src/index.css`:

- Variáveis base `--vy-*` (fundo, painel, elevado, linha, forte, secundário, apagado, órbita, vermelho NASA) com valores do tema escuro em `:root` e do claro em `:root[data-theme='light']` e em `prefers-color-scheme: light` sem escolha guardada.
- Utilitários Tailwind gerados a partir delas (`bg-panel`, `text-strong`, `border-line`, `bg-nasa` etc.) e os nomes semânticos do shadcn/ui (`background`, `primary`, `border`...).
- Escala tipográfica (`text-code`, `text-title`, `text-body`, `text-label`), réguas (`rule-record`, `rule-column`, `rule-section`), `label-caps`, `logotype` e `measure`. Raios zerados.

O tema segue o sistema na primeira visita; o botão ☾/☀ guarda a escolha em `localStorage` (`voyager.theme`). Ver `src/theme/`.

O vermelho NASA (`variant="commit"` do `Button`) é reservado a ações que gravam no repositório e ao status bloqueado.

## Código

| Pasta                                                                | Conteúdo                                                                                                  |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `src/auth`, `server`, `api`                                          | login, sessão e functions do OAuth                                                                        |
| `src/github`, `src/sync`, `src/storage`                              | API do GitHub, sincronização, IndexedDB                                                                   |
| `src/vault`                                                          | índice, contratos, validador portado                                                                      |
| `src/write`                                                          | motor de escrita (frontmatter, auditoria, validação, commit) e planos de status, edição, criação, vínculo |
| `src/shell`, `src/record`, `src/views`, `src/editor`, `src/markdown` | interface                                                                                                 |
| `testing`, `fixtures/vault`                                          | GitHub simulado e vault sintético (contratos, templates e `validar-vault.py` copiados das Skills)         |

Testes contra o GitHub real (só locais): `VOYAGER_REAL_TOKEN` + `VOYAGER_REAL_REPO` (sincronização), `VOYAGER_TEST_REPO=Samuel-Fiais/voyager-vault-teste` (motor de escrita) e `VOYAGER_KB_DIR` (paridade com o `validar-vault.py` e notas reais).

## Segurança e publicação

`docs/seguranca.md` (checklist e riscos) e `docs/publicacao.md` (Vercel).

## Branches

Cada task em `feature/vo-t<nnn>-<nome>`, com PR para a branch de integração `feature/vo-p001`. O PR de `feature/vo-p001` para `main` é aprovado só por Samuel.
