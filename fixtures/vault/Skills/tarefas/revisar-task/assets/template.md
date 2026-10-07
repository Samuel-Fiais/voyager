---
code: "{{task_code}}-REV{{sequence}}"
type: review_record
task: "[[{{task_path}}|{{task_code}} - {{task_name}}]]"
status: changes_requested
review_date: "{{date}}"
pull_request:
pull_request_url:
pull_request_status:
created_by: "{{actor}}"
created_at: "{{iso8601}}"
updated_by: "{{actor}}"
updated_at: "{{iso8601}}"
---

## Escopo revisado

_Os registros, critérios e mudanças avaliados._

## PR e integração

- **PR:** _Link navegável ou referência, ou not_applicable._
- **Situação:** _approved, open ou not_applicable._
- **Branch revisada:** _Nome da branch, quando aplicável._

## Resultado

_Resumo objetivo do parecer._

## Achados

| Severidade | Descrição | Evidência | Ação necessária |
| --- | --- | --- | --- |
| _nenhuma_ | _Sem achados ou detalhe do achado._ | _Link ou referência._ | _Ação ou não aplicável._ |

## Critérios de aceite

| Critério | Situação | Evidência |
| --- | --- | --- |
| _Critério da task_ | _Atendido, parcial ou não atendido_ | _Registro verificável_ |

## Testes e verificações

- **Aplicabilidade:** _executed ou not_applicable_
- **Justificativa e risco residual:** _Obrigatório quando não aplicável._

| Cenário ou verificação | Resultado esperado | Resultado obtido | Evidência |
| --- | --- | --- | --- |
| _Cenário, inspeção ou verificação alternativa_ | _Esperado_ | _Obtido_ | _Link ou referência_ |

## Conhecimento técnico

| Documento ou justificativa | Situação | Evidência |
| --- | --- | --- |
| _Documento consultado, atualizado ou motivo de não aplicabilidade_ | _Válido, atualizado ou aceito_ | _Wikilink ou registro de implementação_ |

## Decisão

_Use `in_review`, `approved`, `changes_requested` ou `blocked` no frontmatter e explique o motivo._

## Auditoria

- `{{iso8601}}` | {{actor}} | created | — | {{status}} | criação do registro

