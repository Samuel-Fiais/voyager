# DESIGN.md — Voyager

Padrão de interface **VO-DS001 (Voyager)**: a identidade do Manual de Normas Gráficas da NASA (1975) com o detalhe espacial das trajetórias. Espacial, mas minimalista; sem cara de SaaS genérico. A referência visual é o mockup v5 da demanda VO-D001; este arquivo descreve como o padrão está no código.

## Tokens (`src/index.css`)

| Variável         | Escuro    | Claro     | Uso                               | Utilitário             |
| ---------------- | --------- | --------- | --------------------------------- | ---------------------- |
| `--vy-bg`        | `#0b0b0c` | `#ffffff` | área de conteúdo                  | `bg-bg`                |
| `--vy-panel`     | `#0e0e0f` | `#f7f7f5` | topo, sidebar, painel direito     | `bg-panel`             |
| `--vy-elevated`  | `#161618` | `#ffffff` | cards, menus, folhas              | `bg-elevated`          |
| `--vy-line`      | `#26262a` | `#deded9` | divisórias de 1px                 | `border` (padrão)      |
| `--vy-strong`    | `#f2f1ec` | `#0b0b0c` | réguas, texto principal           | `text-strong`          |
| `--vy-secondary` | `#b0afa8` | `#45453f` | corpo e metadados                 | `text-secondary`       |
| `--vy-faint`     | `#75746e` | `#85857e` | rótulos, horários                 | `text-faint`           |
| `--vy-orbit`     | `#3d3d42` | `#c9c9c3` | trecho tracejado das trajetórias  | —                      |
| `--vy-nasa`      | `#fc3d21` | `#e0301b` | **só** ação que grava e bloqueado | `bg-nasa`, `text-nasa` |

- Tema: escuro por padrão; segue o sistema na primeira visita (`prefers-color-scheme`) e guarda a escolha do usuário (`data-theme` no `<html>`, `localStorage voyager.theme`). Ver `src/theme/`.
- Tipografia: Archivo (texto; largura 125% só no logotipo, utilitário `logotype`) e JetBrains Mono (códigos, horários, números). Escala: `text-code` (56px/800), `text-title` (24px/500), `text-body` (15px, entrelinha 1,7, `measure` = 70ch), `text-label` + `label-caps` (11px, caixa alta, 0,08em).
- Forma: **sem raios** (todos os `--radius-*` são 0). Réguas: `rule-record` (6px, topo do cabeçalho de registro), `rule-column` (3px, topo de colunas e indicadores), `rule-section` (2px, sob títulos de seção), 1px no resto. Sombra (`shadow-layer`) só em camadas sobrepostas.

## Regras

- **Vermelho NASA** aparece só em ação que grava no repositório (Sincronizar, Confirmar e commitar, Salvar, Continuar em diálogos que gravam) e em bloqueado. O ícone tem a sonda vermelha (única exceção).
- **Status não usa cor**: usa forma (`src/components/status-glyph.tsx`): anel = em revisão/ativo; anel apagado = pronta/rascunho; anel tracejado = ajustes pedidos/esclarecimento; meio cheio = em andamento; cheio apagado = concluída; vermelho = bloqueada; riscado = cancelada/recusada.
- Texto usa tokens de texto, nunca a cor de uma marca.

## Componentes e padrões de tela

| Padrão                    | Onde                                                    | Notas                                                                                                                    |
| ------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Ícone Gravidade assistida | `src/components/voyager-icon.tsx`, `public/favicon.svg` | planeta, trajetória e sonda vermelha; 22px no topo, 18px no celular.                                                     |
| Botão                     | `src/components/ui/button.tsx` (shadcn/ui)              | `default`, `ghost`, `commit` (vermelho, grava).                                                                          |
| Topo                      | `src/shell/top-bar.tsx`                                 | marca, workspace e branch, busca ⌘K, + Nova, sincronização com órbita, tema/conta.                                       |
| Sidebar por entidade      | `src/shell/sidebar.tsx`                                 | views com atenção, views salvas, projetos com mini-trajetória, clientes em chips, recentes, Arquivos do vault no rodapé. |
| Abas                      | `src/shell/tabs.tsx`                                    | código + título, fecham; sem abas, estado vazio.                                                                         |
| Cabeçalho de registro     | `src/record/record-page.tsx` (`RecordHeader`)           | régua de 6px, meta em caixa alta, código grande, título, status ▾ e tags.                                                |
| Painel direito            | `src/record/right-panel.tsx`                            | propriedades, links, backlinks, auditoria; desce abaixo de 1100px.                                                       |
| Trajetória                | `src/record/trajectory.tsx`                             | auditoria (distância = tempo real) e projeto (um ponto por task); dica por mouse e teclado.                              |
| Menu de status            | `src/record/status-menu.tsx`                            | transições do contrato com a condição; ⋯ nos cards.                                                                      |
| Folha de commit           | `src/write/commit-sheet.tsx`                            | diff, auditoria, mensagem, motivo, erros; conflito.                                                                      |
| Kanban                    | `src/views/kanban-view.tsx`                             | colunas com régua de 3px; ao arrastar só as válidas acendem (régua e contorno vermelhos).                                |
| Barras                    | `src/views/custom/bars.tsx`                             | uma série, tom do texto principal, valor escrito, dica; semana parcial tracejada.                                        |
| Celular                   | `src/shell/mobile.tsx`                                  | abaixo de 780px: item por tela, deslize, navegação inferior Painel · Kanban · Vault · Buscar.                            |

A página `/design` mostra os tokens ao vivo nos dois temas.

## Responsivo

- ≥ 1100px: conteúdo + painel direito de 310px.
- 780–1099px: painel direito abaixo do conteúdo.
- < 780px: sidebar vira gaveta (Vault), abas viram a barra do item, navegação inferior; kanban com colunas de 264px e rolagem própria.
- Grades de conteúdo usam `minmax(0, 1fr)` para nada estourar a largura.
