---
type: status_change_checklist
entity_code: "{{code}}"
entity_type: "{{type}}"
from_status: "{{from}}"
to_status: "{{to}}"
updated_by: "{{actor}}"
updated_at: "{{iso8601}}"
evidence: "{{evidence}}"
created_by: "{{actor}}"
created_at: "{{iso8601}}"
updated_by: "{{actor}}"
updated_at: "{{iso8601}}"
---

# Checklist de mudança de status

- [ ] Entidade canônica identificada e aberta
- [ ] Status atual confirmado no arquivo
- [ ] Transição permitida pelo contrato
- [ ] Evidência registrada
- [ ] `status`, `updated_by` e `updated_at` atualizados
- [ ] Linha append-only em `## Auditoria`
- [ ] Encerramento rico desviado para skill de domínio, se aplicável

## Auditoria

- `{{iso8601}}` | {{actor}} | created | — | {{status}} | criação do registro

