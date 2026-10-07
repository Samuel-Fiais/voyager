# Contrato de vocabulário

Cada cliente tem um vocabulário canônico em `Conhecimento Técnico/<cliente>/Vocabulário/`: termos de domínio, siglas, jargões, sistemas, produtos, equipamentos, papéis e organizações que aparecem no trabalho com aquele cliente. O vocabulário existe para que qualquer pessoa ou agente entenda um registro sem precisar da conversa original.

## Estrutura

- Uma nota por termo: `Conhecimento Técnico/<cliente>/Vocabulário/<INICIAIS>-VOC<seq> - <Termo>.md`, como `NG-VOC001 - Site.md`.
- Um índice `README.md` na mesma pasta, com uma linha por termo (termo, categoria, definição curta, confiança).
- A property `aliases` guarda sinônimos, siglas por extenso e grafias alternativas, para que wikilinks e buscas encontrem o termo.
- Modelo: [registrar-vocabulario/assets/template.md](../documentacao/registrar-vocabulario/assets/template.md).

## Consulta obrigatória

O vocabulário é contexto obrigatório. Antes de interpretar, analisar ou escrever qualquer registro de cliente (reunião, demanda, task, bug, revisão, código ligado ao cliente etc.):

1. Leia o índice `README.md` do vocabulário do cliente e as notas dos termos que aparecem no material.
2. Use definição, contexto de uso, "Não confundir com" e questões abertas para interpretar o material. Ao mencionar um termo cadastrado ou um de seus `aliases` com esse sentido, vincule o texto à nota canônica conforme a regra abaixo.
3. Se o termo tiver `confidence: hypothesis` ou questão aberta relevante para o trabalho, trate-o como incerto e pergunte quando a dúvida afetar o resultado.

## Links obrigatórios para termos do vocabulário

Toda Skill que cria ou altera texto no vault deve usar wikilink em **cada ocorrência** de um termo já cadastrado no vocabulário do cliente, inclusive quando usar um `alias`. A regra vale para títulos, parágrafos, listas, tabelas, legendas e índices. Não basta vincular apenas a primeira menção ou adicionar uma lista de links no fim do documento.

- Aponte para a nota canônica, preservando a forma usada no texto como rótulo: `[[Conhecimento Técnico/Estúdio Aurora/Vocabulário/EA-VOC001 - Obra|obra]]` (exemplo fictício).
- Se o termo for criado no mesmo trabalho, conclua a criação da nota e substitua as menções no registro principal por wikilinks antes de finalizar.
- No `README.md` do vocabulário, faça do nome de cada termo um wikilink para sua nota. Ao citar outro termo cadastrado dentro de uma nota de vocabulário, vincule-o também.
- Preserve literais cuja sintaxe ou valor precise permanecer exato: identificadores e trechos de código, caminhos, URLs, nomes de arquivos, propriedades como `term` e `aliases` no frontmatter, transcrições literais de fontes, o título da própria nota de vocabulário e linhas históricas de auditoria append-only. Quando o conceito aparecer apenas em um desses literais, inclua o wikilink em uma explicação próxima. Use links nas novas linhas de auditoria quando citarem termos do cliente.
- Antes de concluir, confira os termos e `aliases` usados no texto, procure menções sem link e confirme que os destinos existem. Não aninhe wikilinks nem altere o destino de links já corretos.

## Divergências

Diverge quando o material novo contradiz a definição, o contexto de uso, os sinônimos ou a distinção registrada de um termo (ex.: o termo é usado com outro sentido, a sigla aparece com outra expansão, um papel faz algo que a nota diz que não faz).

- Pergunte ao usuário antes de seguir. Não sobrescreva a definição nem escolha uma versão silenciosamente.
- Se não for possível perguntar, registre a divergência em `## Questões abertas` da nota, com as duas versões e as fontes, e rebaixe `confidence` para `reported` ou `hypothesis` quando a confiança anterior não se sustentar.
- Após a resposta, atualize a nota, preserve a versão anterior na auditoria e mova a questão para resolvida (removendo-a de `## Questões abertas` com linha na auditoria).
- Novo sentido legítimo para o mesmo termo (homônimo) vira nota própria, ligada em "Não confundir com" nas duas notas.

## Quem alimenta

Toda Skill que produz ou altera registro de cliente alimenta o vocabulário: reuniões, demandas, propostas, projetos, planos, tasks, revisões, bugs, investigações, correções, procedimentos, acompanhamentos, diagramas e conhecimento técnico.

Ao concluir o registro principal:

1. Identifique termos do cliente que um leitor novo não entenderia: siglas, jargões, nomes de sistemas e produtos, papéis, equipamentos, categorias e conceitos de negócio.
2. Pesquise no vocabulário do cliente pelo termo e pelos `aliases` antes de criar.
3. Termo novo: crie a nota com `/registrar-vocabulario`.
4. Termo existente: sempre que o registro trouxer novo uso, exemplo, regra ou relação, **acrescente** em `## Contexto de uso` (com a fonte ao final do item) e **acrescente** a fonte em `sources` e em `## Fontes`. Complemente a definição só quando houver conhecimento confirmado; contradição segue a seção Divergências.
5. Informe no resumo final quais termos foram criados ou atualizados, ou que nenhum termo novo surgiu.

Termos genéricos de tecnologia (ex.: API, PR, React) não entram, a menos que tenham significado específico no cliente.

## Contexto de uso e fontes são cumulativos

- `## Contexto de uso` cresce com o tempo: cada novo uso relevante vira um item, com a fonte ao final, sem apagar os anteriores. Reorganize só para dar clareza, sem perder informação.
- `sources` e `## Fontes` acumulam todo registro em que o termo teve uso relevante, do mais antigo ao mais recente.
- Toda ampliação atualiza `updated_by`/`updated_at` e acrescenta linha `updated` na auditoria.

## Confiança

| `confidence` | Uso |
| --- | --- |
| `confirmed` | Definição confirmada pelo cliente, por Samuel ou por documento oficial. |
| `reported` | Definição relatada em reunião, e-mail ou registro, ainda não confirmada formalmente. |
| `hypothesis` | Interpretação provável; registre a dúvida em `## Questões abertas` da nota. |

Não apresente hipótese como fato. Quando a definição mudar, preserve o histórico na auditoria.

## Status

`active` (em uso), `deprecated` (termo abandonado pelo cliente, mantido para leitura de registros antigos) e `superseded` (substituído por outra nota; preencha `superseded_by`). Não apague notas de vocabulário.

## Limites

- Não registre dados pessoais além do nome e papel profissional necessários para entender o termo.
- Não registre credenciais, valores de ambiente ou segredos.
- O vocabulário explica termos; ele não substitui regra de negócio, decisão, documentação técnica ou modelo de domínio.
- Atributos, relacionamentos, estados e invariantes de uma entidade pertencem ao [domínio](contrato-de-dominio.md). Quando o mesmo termo tiver modelos diferentes em domínios diferentes, registre em `## Contexto de uso` o sentido em cada domínio, com link para a entidade.
