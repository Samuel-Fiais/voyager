# Contrato de auditoria

Toda entidade canônica do vault registra quem a criou e quem a alterou. Auditoria é obrigatória; não é opcional nem decorativa.

## Escopo

Aplica-se a: cliente, repositório, demanda, proposta comercial, projeto, plano de implementação, task, bug, procedimento, acompanhamento, reunião, diagrama, conhecimento técnico, termo de vocabulário, domínio, entidade de domínio, padrão de interface, padrão de tela, configuração do provedor de tasks e artefatos de projeto (decisão, regra, entrega, teste).

## Properties obrigatórias

| Property | Formato | Uso |
| --- | --- | --- |
| `created_by` | nome da pessoa (`Samuel Fiais`) ou `agent:<nome>` | Autor da criação. |
| `created_at` | ISO 8601 com timezone (`2026-09-21T14:00:00-03:00`) | Momento da criação. |
| `updated_by` | mesmo formato de `created_by` | Autor da última alteração material. |
| `updated_at` | ISO 8601 com timezone | Momento da última alteração material. |

Na criação, `created_*` e `updated_*` recebem o mesmo ator e o mesmo instante.

## Seção `## Auditoria`

Toda nota canônica tem a seção `## Auditoria` com log **append-only**:

```markdown
## Auditoria

- `2026-09-21T14:00:00-03:00` | Samuel Fiais | created | — | draft | criação do registro
```

Cada linha: `quando | quem | ação | de | para | evidência/nota`.

- Não apague nem reescreva linhas antigas.
- Em mudança de status, `ação` é `status_change` (ou equivalente claro); preencha `de` e `para`.
- Em edição material sem mudança de status, use `updated` e descreva o que mudou na evidência.

## Ator

- Quando um agente criar ou alterar o registro, use `agent:<nome-do-agente-em-minúsculas>` em `created_by`, `updated_by` e na nova linha de `## Auditoria`, mesmo que Samuel tenha solicitado a execução.
- Use `Samuel Fiais` somente para alteração feita por ele próprio. O solicitante pode ser citado na evidência, sem substituir o autor da mudança.
- O nome do agente vai sempre em minúsculas (`agent:grace`, nunca `agent:Grace`); o validador (`Skills/scripts/validar-vault.py`) bloqueia o commit fora desse formato e também bloqueia linha antiga de `## Auditoria` apagada, alterada ou reordenada.
- Se o ator estiver incerto, pergunte. **Não invente autor.**

## Obrigações das Skills

- Skills de criação preenchem auditoria na criação.
- Skills de atualização, revisão, encerramento e `/atualizar-status` atualizam `updated_*` e acrescentam linha no log.
- Cite este contrato nas referências comuns e cumpra-o no processo.
