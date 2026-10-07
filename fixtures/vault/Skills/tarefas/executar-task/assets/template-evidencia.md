---
code: "{{task_code}}-EVD{{sequence}}"
type: evidence
task: "[[{{task_path}}|{{task_code}} - {{task_name}}]]"
evidence_kind: test_result
status: recorded
date: "{{date}}"
created_by: "{{actor}}"
created_at: "{{iso8601}}"
updated_by: "{{actor}}"
updated_at: "{{iso8601}}"
---

## Evidência

_Descreva o resultado de teste, captura, roteiro, log ou inspeção registrada._

## Fonte e contexto

_Origem, ambiente, data, pessoa ou sistema envolvido._

## Interpretação limitada

_O que esta evidência permite concluir e o que ainda não permite._

## Vínculos

- Task: [[{{task_path}}|{{task_code}} - {{task_name}}]]

## Auditoria

- `{{iso8601}}` | {{actor}} | created | — | {{status}} | criação do registro
