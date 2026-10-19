---
code: "{{client_initials}}-ENT{{sequence}}"
type: delivery
project: "[[{{project_path}}|{{project_code}} - {{project_name}}]]"
status: planned
delivery_date:
created_by: "{{actor}}"
created_at: "{{iso8601}}"
updated_by: "{{actor}}"
updated_at: "{{iso8601}}"
---

## Conteúdo entregue

- _Item entregue._

## Critérios verificados

- [ ] _Critério ou condição de aceite._

## Evidências

- _Link para task, teste ou registro de aprovação._

## Pendências

- _Nenhuma ou detalhe da pendência._

## Conclusão

_Use `planned`, `delivered`, `accepted` ou `blocked` no frontmatter._

## Auditoria

- `{{iso8601}}` | {{actor}} | created | — | {{status}} | criação do registro

