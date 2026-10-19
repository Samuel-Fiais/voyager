# Referências operacionais compartilhadas

As Skills mantêm seus próprios limites e perguntas obrigatórias. Esta referência concentra contratos que não devem ser copiados integralmente em cada uma.

## Vault e versionamento Git

- O `knowledge-base` centraliza todo o trabalho: Fiais, NG Solutions, Portulan e demais clientes/projetos.
- Antes de qualquer trabalho no vault, execute `git pull --ff-only` e carregue a skill correspondente.
- Após alterações, faça `git add` dos arquivos do trabalho, `git commit` e `git push` para `origin/main`. A ordem permanente de Samuel autoriza e exige esses passos no vault, inclusive quando a skill condiciona publicação a pedido explícito.
- Antes de todo commit no vault, rode `python3 Skills/scripts/validar-vault.py --staged` e corrija cada erro (o hook `.githooks/pre-commit` faz isso automaticamente). Nunca use `--no-verify`. Ver [contrato de frontmatter](contrato-de-frontmatter.md).
- Fora do vault, commit, push e publicação continuam exigindo pedido explícito.
- Siga [SETUP — Versionamento Git](../../SETUP.md#versionamento-git-obrigatório). Nunca faça force-push ou inclua segredos.

## Isolamento dos exemplos das Skills

- SKILL.md, templates, exemplos e referências das Skills não devem conter links para registros reais de produção, como cliente, projeto, demanda, task ou vocabulário.
- Use placeholders ou um cenário inteiramente fictício para demonstrar caminhos, códigos e wikilinks. Links para arquivos da própria documentação das Skills são permitidos.
- Ao atualizar uma Skill, confira se cada link ilustrativo não aponta para uma nota real do vault.

## Provedor de tasks

- A configuração canônica está em [Configuracao/Provedor de Tasks.md](../../Configuracao/Provedor%20de%20Tasks.md).
- O vault é a fonte de verdade para status e evidências.
- Sistemas externos são espelhos autorizados; não definem status canônico.
- **Sincronização obrigatória:** toda Skill que criar ou alterar uma task canônica (criação, status, responsável, dependências, branch ou PR) executa `/sincronizar-tasks` ao final, na mesma execução, sem pedir nova autorização. A ordem permanente de Samuel (2026-10-06) vale como a autorização explícita que as Skills exigem para escrever no espelho configurado. Se o provedor estiver `none` ou indisponível, registre a pendência na task.
- Consulte também [contrato de status de tasks](contrato-de-status-de-tasks.md).

## Frontmatter

- Consulte [contrato de frontmatter](contrato-de-frontmatter.md).
- Toda nota nasce do template da Skill, copiado literalmente; nunca de nota vizinha, exemplo ou memória.
- `type` e `status` vêm só dos contratos de status, sem aspas e sem sinônimos ou traduções. Caso não previsto: pergunte a Samuel antes de criar valor novo.
- `code` único, no padrão do template e no início do nome do arquivo; registros filhos herdam o código do pai (`OJ-T010-IMP001`).
- Exportações e rascunhos ficam fora do vault.

## Status de entidades

- Consulte [contrato de status de entidades](contrato-de-status-de-entidades.md): ele é o registro fechado de todos os `type` (entidades e registros filhos) e de seus status permitidos.
- Transições genéricas usam `/atualizar-status`. Encerramentos com checklist usam `/encerrar-projeto` ou `/encerrar-bug`.

## Auditoria

- Consulte [contrato de auditoria](contrato-de-auditoria.md).
- Toda entidade canônica tem `created_by`, `created_at`, `updated_by`, `updated_at` e seção `## Auditoria` append-only.
- Não invente ator; não apague histórico.

## Conhecimento técnico

- Consulte [contrato de conhecimento técnico](contrato-de-conhecimento-tecnico.md) antes de analisar ou alterar código.
- Atualize o registro técnico canônico quando houver conhecimento material novo, alterado ou corrigido.
- Pesquise antes de criar para evitar documentação duplicada.

## Vocabulário do cliente

- Consulte [contrato de vocabulário](contrato-de-vocabulario.md).
- Cada cliente tem `Conhecimento Técnico/<cliente>/Vocabulário/`, uma nota por termo e um índice `README.md`.
- Toda Skill que gera registro de cliente (reunião, demanda, proposta, projeto, plano, task, revisão, bug, procedimento, acompanhamento, diagrama, conhecimento técnico) alimenta o vocabulário ao concluir, via `/registrar-vocabulario`.
- Antes de interpretar ou escrever qualquer registro de cliente, consulte o vocabulário dele para ampliar o contexto; se o material divergir de um termo, pergunte antes de seguir.
- Em todo texto produzido ou alterado por qualquer Skill, cada menção a termo ou `alias` do vocabulário do cliente deve ser um wikilink para sua nota canônica; aplique as exceções de literais e a verificação final do [contrato de vocabulário](contrato-de-vocabulario.md).
- `## Contexto de uso` e `## Fontes` dos termos são cumulativos: acrescente, não substitua.

## Domínio do cliente

- Consulte [contrato de domínio](contrato-de-dominio.md).
- Cada cliente pode ter vários domínios em `Conhecimento Técnico/<cliente>/Domínios/`, uma pasta por domínio com a nota do domínio e uma nota por entidade.
- Antes de interpretar ou escrever registro que envolva estrutura do negócio (entidades, estados, relações, regras), consulte o domínio correspondente; se o domínio for incerto ou o material divergir do modelo, pergunte.
- Toda Skill pode e deve alimentar o domínio quando o trabalho revelar, propor ou alterar entidade, atributo, relacionamento, estado ou invariante, via `/registrar-dominio`. Estrutura não confirmada entra como `proposed`.
- Projetos e demandas registram seus domínios na property `domains`.

## Design do cliente

- Consulte [contrato de design](contrato-de-design.md).
- Cada cliente pode ter vários padrões de interface em `Conhecimento Técnico/<cliente>/Design/`, uma pasta por padrão com a nota do padrão e, quando houver, padrões de tela.
- Antes de propor, planejar, implementar ou revisar telas, consulte o padrão adotado pelo projeto; desvio exige decisão do projeto.
- Toda Skill que trabalhe com interface pode e deve alimentar o design quando o trabalho revelar, adotar ou alterar decisões visuais, via `/registrar-design`.
- Projetos e demandas registram seus padrões na property `design_systems`.

## Arquitetura do cliente

- Consulte [contrato de arquitetura](contrato-de-arquitetura.md).
- Cada cliente pode ter várias arquiteturas em `Conhecimento Técnico/<cliente>/Arquitetura/`, uma pasta por sistema com a nota da arquitetura e, quando houver, notas de componente.
- Antes de propor, planejar, implementar, investigar ou revisar mudanças em componentes, integrações, stack, dados, infraestrutura ou segurança, consulte a arquitetura usada pelo projeto; mudança de arquitetura exige decisão do projeto.
- Toda Skill que trabalhe com a estrutura técnica de um sistema pode e deve alimentar a arquitetura quando o trabalho revelar, adotar ou alterar decisões arquiteturais, via `/documentar-arquitetura`.
- Projetos e demandas registram suas arquiteturas na property `architectures`.

## Vínculos obrigatórios

- Consulte [contrato de vínculos](contrato-de-vinculos.md).
- Todo documento relacionado a outro (reunião, task, bug, demanda, proposta, projeto, plano, conhecimento técnico, vocabulário etc.) deve estar ligado a ele nos dois sentidos, com auditoria no documento que recebeu o link de volta.

## Perguntas e incerteza

- Faça perguntas quando a lacuna puder alterar escopo, decisão, segurança, evidência ou resultado.
- Registre hipótese e pergunta aberta sem apresentá-las como fato.


## Entrega e revisão

- Código: commit + push + PR → status `in_review`, com a task entregue ao revisor.
- Developer não marca `done`; reviewer promove após `/revisar-task` aprovada.
- Durante a revisão a task permanece `in_review`. Com pendências: o revisor registra `changes_requested`, lista as pendências e devolve a task ao desenvolvedor que a entregou, que a retoma em `in_progress` (`/corrigir-revisao`) e reentrega. Sem pendências: o revisor tenta aprovar o PR e a task segue para `done`.
- Aprovação de PR: o autor humano do PR pode aprovar o próprio PR, e a falta de conta revisora independente não bloqueia a revisão. Sem pendências, o revisor tenta aprovar o PR. Se a plataforma de código recusar a aprovação por ser o mesmo autor, o revisor não troca de conta nem de credencial: registra o parecer "sem pendências" como comentário no PR e na task, faz o merge do PR na branch de integração do projeto (nunca na branch principal ou de produção, que segue exclusiva do responsável humano) e promove a task a `done`. O relato deve ser fiel: "aprovação formal recusada (mesmo autor); parecer sem pendências registrado; merge feito por autorização do Samuel (03/10/2026)". Nunca declare o PR como aprovado quando a aprovação foi recusada. Registre `pull_request_status: merged` na task. A aprovação formal por outro revisor (humano ou agente com navegador) é opcional e, se feita, é registrada na task/PR. Decisão de Samuel Fiais, 2026-10-03.
- Verificação visual (mobile, tablet, desktop e fluxos de verificação, VIP ou conteúdo adulto): se houver como validar localmente com dados de teste, valide. Se não houver ambiente de homologação nem perfis de teste, o bypass é permitido: registre no parecer "verificação visual não realizada: sem ambiente de homologação/perfis; bypass autorizado por Samuel (2026-10-03)" e liste como risco residual o que ficou sem verificar. O bypass não bloqueia a aprovação.
- Vault: pull antes; commit + push depois (ver SETUP).
