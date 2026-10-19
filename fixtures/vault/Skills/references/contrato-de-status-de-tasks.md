# Contrato de status de tasks

Este contrato vale para qualquer sistema externo de acompanhamento. O documento da task no vault é a fonte de verdade; sistemas externos apenas espelham o status registrado e comprovado aqui.

## Status permitidos

| Status | Condição documental |
| --- | --- |
| `planned` | A task foi identificada no plano de implementação. |
| `ready` | Escopo, dependências e critérios de aceite estão claros no arquivo principal da task. |
| `in_progress` | Existe ao menos um registro de implementação vinculado e toda dependência que seja uma task possui PR aprovado. |
| `in_review` | A implementação foi encerrada, commitada, com PR aberto quando aplicável, e submetida à revisão. Quem implementou move para este status; não para `done`. |
| `changes_requested` | O registro obrigatório de revisão solicitou alterações. |
| `blocked` | Um impedimento foi registrado no arquivo principal da task. |
| `done` | Há implementação registrada, revisão aprovada, testes executados ou não aplicáveis justificados, documentação técnica atualizada ou não aplicável e PR aprovado quando aplicável. **Somente o fluxo de revisão** (`/revisar-task` com `approved`) promove para `done`. Developer não marca `done`. |
| `cancelled` | O cancelamento e sua justificativa foram registrados no arquivo principal. |

## Ordem de atualização

1. Crie ou atualize o documento que comprova o acontecimento.
2. Atualize o `status` e a lista `status_evidence` da task.
3. Somente então espelhe esse status no sistema externo configurado, **sempre na mesma execução** (`/sincronizar-tasks`, obrigatório ao final de toda atividade com tasks; ver operação compartilhada).

Nunca altere um status externo primeiro e depois tente reconstruir a evidência no vault. Uma mudança externa não é evidência suficiente para alterar a task canônica.

## Registros obrigatórios

- Toda task concluída possui pelo menos um documento em `Implementação/` e um em `Revisões/` com `status: approved`.
- O documento de revisão é obrigatório, inclusive quando não houver achados, e registra testes executados ou a justificativa para sua não aplicabilidade.
- Task que altera repositório possui branch dedicada com `branch_url` e PR registrado com `pull_request_url`. Quando esses links estiverem disponíveis, também precisam ficar visíveis no espelho externo configurado. Uma task dependente não inicia enquanto cada dependência de task não possuir PR com `pull_request_status: approved`.
- Toda task avalia a documentação técnica relacionada. Para ser concluída, `knowledge_status` precisa ser `updated` ou `not_applicable`, com documentação ou justificativa registrada.
- Evidências de status devem ser wikilinks para registros existentes.


## Papéis e status

- **Developer / executor:** pode mover até `in_progress` e, ao concluir implementação com commit + push + PR (quando houver repositório), para `in_review`. Não marca `done`.
- **Reviewer:** executa `/revisar-task`. Só então a task pode ir para `done`, `changes_requested` ou `blocked`.
- Working tree sujo sem commit/PR não justifica `in_review` nem `done`.
