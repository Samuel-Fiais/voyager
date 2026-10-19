---
code: "{{client_initials}}-T{{sequence}}"
type: task
status: planned
project:
origin_bug:
repository:
dependencies: []
created_by: "{{actor}}"
created_at: "{{iso8601}}"
updated_by: "{{actor}}"
updated_at: "{{iso8601}}"
---

# {{code}} - Correção de {{bug_code}}

## Objetivo

_Corrigir o comportamento confirmado em {{bug_code}}._

## Escopo

_Alterações necessárias e limites explícitos._

## Critérios de aceite

- [ ] O comportamento relatado no bug não se reproduz.
- [ ] Casos de regressão listados foram verificados.

## Evidências do bug

- _Wikilinks para investigação e evidências._

## Auditoria

- `{{iso8601}}` | {{actor}} | created | — | planned | task de correção criada a partir do bug
