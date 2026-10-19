---
code: "CFG-TASKS"
type: task_provider_configuration
status: active
provider: none
destination:
workspace:
project:
sync_mode: manual
integration_available: false
external_links_location: description
last_updated:
created_by: "{{actor}}"
created_at: "{{iso8601}}"
updated_by: "{{actor}}"
updated_at: "{{iso8601}}"
---

## Mapeamento de status

| Status canônico | Status externo | Sincronizar? | Observação |
| --- | --- | --- | --- |
| planned | _Não configurado_ | Não | |
| ready | _Não configurado_ | Não | |
| in_progress | _Não configurado_ | Não | |
| in_review | _Não configurado_ | Não | |
| changes_requested | _Não configurado_ | Não | |
| blocked | _Não configurado_ | Não | |
| done | _Não configurado_ | Não | |
| cancelled | _Não configurado_ | Não | |

## Regras de sincronização

_Quando espelhar, como detectar divergência e quem tem autoridade para autorizar escrita._

## Links obrigatórios no espelho

| Link | Property canônica | Local no provedor |
| --- | --- | --- |
| Branch | `branch_url` | _description por padrão_ |
| PR | `pull_request_url` | _description por padrão_ |

_Altere o local somente se o provedor oferecer um campo melhor e os links continuarem sempre visíveis._

## Segurança

_Não registre tokens, senhas, chaves ou dados sensíveis neste arquivo._

## Auditoria

- `{{iso8601}}` | {{actor}} | created | — | {{status}} | criação do registro

