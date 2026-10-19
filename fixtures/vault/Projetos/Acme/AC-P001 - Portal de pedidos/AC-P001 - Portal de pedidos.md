---
code: "AC-P001"
type: project
status: active
client: "[[Clientes/C001 - Acme|C001 - Acme]]"
commercial_proposal:
repositories:
  - "[[Repositorios/Acme/AC-R001 - portal|AC-R001 - portal]]"
domains: []
design_systems: []
architectures: []
start_date: "2026-09-05"
target_date:
end_date:
created_by: "agent:claude"
created_at: "2026-09-05T14:00:00-03:00"
updated_by: "agent:claude"
updated_at: "2026-09-06T10:30:00-03:00"
---

## Objetivo

Portal de pedidos da Acme.

## Acompanhamento

```query
title: Tasks em aberto
type: task
project: AC-P001
status: [in_progress, in_review, blocked]
columns: [code, title, status]
```

```chart
title: Tasks por status
type: task
project: AC-P001
by: status
```

```kanban
type: task
project: AC-P001
```

## Links do projeto

### Planos de implementação

- [[Projetos/Acme/AC-P001 - Portal de pedidos/Planos de Implementação/AC-IP001 - MVP do portal|AC-IP001 - MVP do portal]]

### Decisões

- [[Projetos/Acme/AC-P001 - Portal de pedidos/Decisões/AC-DEC001 - Gateway de pagamento|AC-DEC001 - Gateway de pagamento]]

### Tasks

- [[Projetos/Acme/AC-P001 - Portal de pedidos/Tasks/AC-T001 - Login de clientes/AC-T001 - Login de clientes|AC-T001 - Login de clientes]]
- [[Projetos/Acme/AC-P001 - Portal de pedidos/Tasks/AC-T002 - Catálogo de produtos/AC-T002 - Catálogo de produtos|AC-T002 - Catálogo de produtos]]
- [[Projetos/Acme/AC-P001 - Portal de pedidos/Tasks/AC-T003 - Carrinho/AC-T003 - Carrinho|AC-T003 - Carrinho]]
- [[Projetos/Acme/AC-P001 - Portal de pedidos/Tasks/AC-T004 - Pagamento/AC-T004 - Pagamento|AC-T004 - Pagamento]]
- [[Projetos/Acme/AC-P001 - Portal de pedidos/Tasks/AC-T005 - Relatórios/AC-T005 - Relatórios|AC-T005 - Relatórios]]
- [[Projetos/Acme/AC-P001 - Portal de pedidos/Tasks/AC-T006 - Exportação de pedidos/AC-T006 - Exportação de pedidos|AC-T006 - Exportação de pedidos]]

## Auditoria

- `2026-09-05T14:00:00-03:00` | agent:claude | created | — | planning | criação
- `2026-09-06T10:30:00-03:00` | agent:claude | status_change | planning | active | tasks criadas
