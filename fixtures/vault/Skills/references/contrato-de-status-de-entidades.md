# Contrato de status de entidades

Status canônicos ficam no vault. Este contrato cobre entidades que não são tasks. Para tasks, use [contrato-de-status-de-tasks.md](contrato-de-status-de-tasks.md).

Esta tabela é o **registro fechado de `type`**: toda nota canônica usa exatamente um `type` listado aqui e um `status` permitido para ele. Sinônimos, traduções e variantes (`implementacao`, `implementation`, `evidence_record`, `concluida`…) são inválidos. Um type ou status novo só entra depois de incluído nesta tabela, com aprovação de Samuel. O validador (`Skills/scripts/validar-vault.py`) lê esta tabela e bloqueia o commit fora dela; ver [contrato de frontmatter](contrato-de-frontmatter.md).

## Status por tipo

| `type` | Status permitidos | Status inicial | Notas |
| --- | --- | --- | --- |
| `company` / `individual` (cliente) | `potential`, `active`, `paused`, `closed` | `active` (ou `potential` se explícito) | Cadastro via `/criar-cliente`; `individual` para pessoa física. |
| `repository` | `active`, `archived` | `active` | Cadastro via `/criar-repositorio`. |
| `demand` | `discovered`, `needs_clarification`, `ready`, `declined` | `discovered` | Encaminhamento em `routing`, não no status. |
| `commercial_proposal` | `draft`, `sent`, `approved`, `rejected`, `expired`, `superseded` | `draft` | `approved` exige evidência explícita. |
| `project` | `planning`, `active`, `on_hold`, `blocked`, `completed`, `cancelled` | `planning` | `completed`/`cancelled` preferir `/encerrar-projeto`. |
| `implementation_plan` | `draft`, `in_review`, `approved`, `superseded` | `draft` | Só `approved` gera tasks. |
| `task` | ver contrato de tasks | `planned` | `cancelled` via `/atualizar-status` ou fluxo explícito. |
| `bug` | `reported`, `investigating`, `confirmed`, `needs_info`, `in_progress`, `resolved`, `duplicate`, `not_a_bug`, `cannot_reproduce`, `cancelled`, `reopened` | `reported` | Encerramentos tipados preferir `/encerrar-bug`; `reopened` via `/atualizar-status`. |
| `procedure` | `draft`, `active`, `superseded`, `retired` | `draft` | `active` só após validação prática. |
| `vocabulary_term` | `active`, `deprecated`, `superseded` | `active` | Cadastro via `/registrar-vocabulario`; `superseded` exige `superseded_by`. |
| `domain` | `proposed`, `active`, `deprecated`, `superseded` | `proposed` | Cadastro via `/registrar-dominio`; `active` com fronteira confirmada; `superseded` exige `superseded_by`. |
| `design_system` | `proposed`, `active`, `deprecated`, `superseded` | `proposed` | Cadastro via `/registrar-design`; `active` quando adotado por decisão ou confirmação explícita. |
| `design_pattern` | `proposed`, `active`, `deprecated`, `superseded` | `proposed` | Cadastro via `/registrar-design`; `active` quando usado em entrega ou confirmado. |
| `architecture` | `proposed`, `active`, `deprecated`, `superseded` | `proposed` | Cadastro via `/documentar-arquitetura`; `active` quando adotada por decisão ou implementada em código entregue. |
| `architecture_component` | `proposed`, `active`, `deprecated`, `superseded` | `proposed` | Cadastro via `/documentar-arquitetura`; `active` quando existe em código entregue ou foi confirmado. |
| `domain_entity` | `proposed`, `active`, `deprecated`, `superseded` | `proposed` | Cadastro via `/registrar-dominio`; `active` com evidência (cliente, plano aprovado ou código entregue). |
| `implementation_record` | `in_progress`, `in_review`, `done`, `cancelled` | `in_progress` | Registro em `Implementação/` (`/executar-task`, `/corrigir-revisao`). `in_review` ao entregar para revisão; `done` só depois de `/revisar-task` aprovar a task; developer não marca `done`. |
| `review_record` | `in_review`, `approved`, `changes_requested`, `blocked` | `in_review` | Parecer em `Revisões/` (`/revisar-task`). |
| `evidence` | `open`, `recorded`, `superseded` | `recorded` | Evidência de task, bug ou demanda em `Evidências/`. `open` para pergunta ou pendência sem resposta. Substitui `evidence_record` e `issue_evidence`. |
| `bug_investigation` | `investigating`, `confirmed`, `needs_info`, `duplicate`, `not_a_bug`, `cannot_reproduce` | `investigating` | `/investigar-bug`. |
| `bug_resolution` | `resolved`, `duplicate`, `not_a_bug`, `cannot_reproduce`, `cancelled` | `resolved` | `/encerrar-bug`. |
| `project_closure` | `completed`, `cancelled` | `completed` | `/encerrar-projeto`. |
| `decision` | `proposed`, `accepted`, `rejected`, `superseded` | `accepted` | `/documentar-projeto`; `superseded` aponta a decisão que a substitui. |
| `business_rule` | `proposed`, `active`, `deprecated`, `superseded` | `active` | `/documentar-projeto`. |
| `meeting` | `recorded`, `follow_up_pending` | `recorded` | `/registrar-reuniao` ou `/documentar-projeto`; `follow_up_pending` enquanto houver encaminhamento aberto. |
| `delivery` | `planned`, `delivered`, `accepted`, `cancelled` | `planned` | `/documentar-projeto`; `accepted` exige aceite explícito do cliente. |
| `project_test` | `planned`, `passed`, `failed`, `blocked`, `not_applicable` | `planned` | `/documentar-projeto`. |
| `technical_knowledge` | `active`, `deprecated`, `superseded` | `active` | `/documentar-conhecimento-tecnico`; `superseded` com link para o canônico. |
| `diagram` | `draft`, `active`, `superseded` | `draft` | `/criar-diagrama`. |
| `process_report` | `active`, `superseded` | `active` | `/criar-acompanhamento`; `superseded` quando um acompanhamento mais novo o substitui. |
| `task_provider_configuration` | `active`, `superseded` | `active` | `Configuracao/Provedor de Tasks.md` (`/configurar-provedor-de-tasks`). |

## Quem muda status

1. **Criação** — a skill de domínio define apenas o status inicial.
2. **`/atualizar-status`** — transição canônica com evidência e auditoria, para qualquer tipo acima.
3. **Skill de domínio** — pode mudar status quando o próprio fluxo o exige (ex.: `/investigar-bug` → `confirmed`; `/revisar-task` → `done`), sempre com auditoria.
4. **`/encerrar-projeto` e `/encerrar-bug`** — use-os quando houver checklist de encerramento; não substitua por um flip cego em `/atualizar-status`.

## Evidência

Toda transição registra evidência (wikilink, citação, motivo). Sem evidência, pergunte. Não marque `approved`, `resolved`, `completed` ou `active` (procedimento, domínio ou entidade de domínio) por inferência.
