# Contrato de frontmatter

O frontmatter das notas canônicas é lido por máquina (Bases do Obsidian, sistema web do vault, espelho de tasks). Por isso `type`, `status`, `code` e as properties de auditoria seguem um formato fechado. Este contrato vale para toda Skill, agente ou pessoa que crie, altere, importe ou mova notas.

## Regras

1. **Nota nasce do template.** Crie toda nota copiando o template da Skill (`Skills/<área>/<skill>/assets/`) e preenchendo os placeholders. Não use como modelo uma nota vizinha, o exemplo fictício ou a memória: notas reais podem conter divergências antigas. Não renomeie seções nem properties do template.
2. **`type` e `status` fechados.** Use apenas os valores do [contrato de status de entidades](contrato-de-status-de-entidades.md) e do [contrato de status de tasks](contrato-de-status-de-tasks.md). Nenhum sinônimo, tradução ou variante. Se o caso não couber em nenhum type ou status, **pare e pergunte a Samuel**; um valor novo só existe depois de entrar no contrato e no template.
3. **Toda nota canônica tem `status`.** Inclusive registros filhos (implementação, revisão, evidência) e configuração.
4. **Aspas.** `type` e `status` vão sem aspas (`type: task`, `status: in_review`). Datas e instantes vão entre aspas (`created_at: "2026-10-06T21:30:00-03:00"`), para continuarem texto. Wikilinks em properties vão entre aspas. Nos templates, `code` com placeholder `{{...}}` exige aspas; o valor preenchido pode mantê-las.
5. **`code` e nome do arquivo.** O arquivo se chama `<code> - <nome>.md` (clientes: `C001 - Nome.md`). O `code` segue o padrão do template e é único no vault. Registros filhos herdam o código do pai: `OJ-T010-IMP001`, `OJ-T010-REV001`, `OJ-T010-EVD001`, `NG-BUG001-INV001`. Antes de escolher a sequência, procure o maior código existente **no vault inteiro** (não só na pasta) e some 1.
6. **Auditoria.** `created_by`, `created_at`, `updated_by`, `updated_at` e a seção `## Auditoria` append-only, conforme o [contrato de auditoria](contrato-de-auditoria.md). Ator de agente sempre em minúsculas: `agent:grace`, nunca `agent:Grace`.
7. **Nada de arquivo solto.** Exportações, rascunhos e corpos para colar em outro sistema são gerados fora do vault (diretório temporário). No vault, `.md` sem frontmatter só é permitido para `README.md` (índices) e `SETUP.md`.
8. **Importação em lote** (de outro sistema, agente ou script) segue as mesmas regras e passa pelo validador antes do commit.
9. **Mudança de nome ou caminho** atualiza todos os wikilinks que apontam para a nota, por caminho e por nome, na mesma alteração.

## Validação obrigatória

- Rode `python3 Skills/scripts/validar-vault.py --staged` antes de todo commit no vault e corrija cada erro. O script lê as tabelas dos contratos de status e os templates; ele é a verificação executável deste contrato.
- O hook `.githooks/pre-commit` roda o validador automaticamente quando o clone tem `git config core.hooksPath .githooks` (ver `SETUP.md`). O workflow `.github/workflows/validar-vault.yml` repete a validação a cada push.
- Commit que falha na validação não é publicado. **Nunca use `git commit --no-verify`** para contornar o validador; corrija a nota, o template ou, com aprovação de Samuel, o contrato.
- O validador verifica: YAML válido; `type` no contrato; `status` permitido; `type`/`status` sem aspas; `code` presente, único, no padrão do template e no início do nome do arquivo; properties de auditoria em ISO 8601 com timezone; ator `agent:` em minúsculas; seção `## Auditoria` com ao menos uma linha; wikilinks e links Markdown que resolvem; nenhum registro real ligando a `Skills/` ou aos arquivos de raiz; `.md` sem frontmatter. Em `--staged`, também verifica que linhas antigas de `## Auditoria` não foram apagadas, alteradas nem reordenadas, e que cada nota alterada ganhou uma linha nova. Templates, exemplos e `SKILL.md` também são validados, para que uma Skill não volte a gerar valor fora do contrato.

## Valores substituídos (normalização VO-D001, 2026-10-06)

| Antes | Depois |
| --- | --- |
| `type: implementacao`, `type: implementation` | `type: implementation_record` |
| `type: evidence_record`, `type: issue_evidence` | `type: evidence` |
| `status: concluida`, `active`, `delivered` em registro de implementação | `status: in_review` |
| evidência sem `status` | `status: recorded` |
| `task_provider_configuration` sem `status` | `status: active` |
| `type: "task"`, `status: "done"` (com aspas) | `type: task`, `status: done` |
| `agent:Grace`, `agent:Dennis`, `agent:Gandalf` em properties | `agent:grace`, `agent:dennis`, `agent:gandalf` (linhas antigas de auditoria preservadas) |
