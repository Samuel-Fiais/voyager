---
code: "{{client_initials}}-TS{{sequence}}"
type: project_test
project: "[[{{project_path}}|{{project_code}} - {{project_name}}]]"
status: planned
test_date:
created_by: "{{actor}}"
created_at: "{{iso8601}}"
updated_by: "{{actor}}"
updated_at: "{{iso8601}}"
---

## Objetivo da validação

_Fluxo transversal, regressão ou marco coberto._

## Escopo

_O que será validado e o que fica fora._

## Cenários

| Cenário | Resultado esperado | Resultado | Evidência |
| --- | --- | --- | --- |
| _Cenário_ | _Esperado_ | _Obtido_ | _Link ou referência_ |

## Conclusão

_Use `planned`, `passed`, `failed` ou `blocked` no frontmatter._

## Auditoria

- `{{iso8601}}` | {{actor}} | created | — | {{status}} | criação do registro

