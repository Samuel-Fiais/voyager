# Contrato de domínio

Cada cliente pode ter vários domínios (contextos delimitados): recortes do negócio com modelo próprio, como vistoria, leilão de serviço ou faturamento. O domínio descreve **como o negócio se estrutura**: entidades, atributos, relacionamentos, ciclo de vida e invariantes. Ele existe para que demandas, planos e tasks partam de um modelo compartilhado, em vez de redescobri-lo a cada trabalho.

## Estrutura

```text
Conhecimento Técnico/<cliente>/Domínios/
├── README.md                                   ← índice dos domínios do cliente
└── <INICIAIS>-DOM<seq> - <Domínio>/
    ├── <INICIAIS>-DOM<seq> - <Domínio>.md      ← nota do domínio (fronteira, modelo, projetos)
    ├── <INICIAIS>-DOM<seq>-E<seq> - <Entidade>.md
    └── ...
```

- Domínio: `<INICIAIS>-DOM<seq>`, sequência por cliente. Modelo: [registrar-dominio/assets/template-dominio.md](../documentacao/registrar-dominio/assets/template-dominio.md).
- Entidade: `<código do domínio>-E<seq>`, sequência por domínio. Modelo: [registrar-dominio/assets/template-entidade.md](../documentacao/registrar-dominio/assets/template-entidade.md).
- O índice `README.md` tem uma linha por domínio (domínio, propósito curto, status, projetos).
- A nota do domínio lista suas entidades e traz o diagrama do modelo (Mermaid `erDiagram` ou `classDiagram`).

## Fronteira com outros registros

| Registro | Responde | Onde |
| --- | --- | --- |
| Vocabulário | O que a palavra significa para o cliente. | `Conhecimento Técnico/<cliente>/Vocabulário/` |
| Domínio | Como o negócio se estrutura naquele contexto. | `Conhecimento Técnico/<cliente>/Domínios/` |
| Regra de negócio | Qual decisão formal vale no projeto. | `Projetos/<cliente>/<projeto>/Regras de Negócio/` |
| Design | Como as telas se apresentam (ver [contrato de design](contrato-de-design.md)). | `Conhecimento Técnico/<cliente>/Design/` |
| Arquitetura | Como o sistema se divide, guarda dados e é implantado (ver [contrato de arquitetura](contrato-de-arquitetura.md)). | `Conhecimento Técnico/<cliente>/Arquitetura/` |
| Conhecimento técnico | Como o código implementa (campos, tabelas, classes). | `Conhecimento Técnico/<cliente>/<repositório>/` |

- A entidade **não repete** a definição do termo: ela aponta para a nota `VOC` em `term`.
- Atributos são **conceituais** (o que o negócio guarda), sem tipo de dado, coluna ou classe. O mapeamento para o código fica no conhecimento técnico, ligado em `technical_documents`.
- Invariantes podem nascer na entidade; quando formalizadas em projeto, a entidade aponta para a `RN` em `rules` e a `RN` aponta de volta para a entidade.

## Mesmo termo em domínios diferentes

- Domínios são independentes. A mesma palavra pode ter modelos diferentes em domínios diferentes (a O.S. de um domínio não precisa ter os atributos ou estados da O.S. de outro).
- Nesse caso, crie **uma entidade por domínio**, cada uma ligada ao mesmo termo `VOC`. Registre em `## Contexto de uso` do termo o sentido que ele assume em cada domínio.
- Quando uma entidade de um domínio depender de outra de outro domínio, registre a relação em `## Relação com outros domínios` das duas notas de domínio (quem fornece, quem consome, o que é traduzido).
- Não una domínios só porque compartilham termos. Divida ou una domínios apenas com decisão explícita.

## Domínios e projetos

- Um projeto usa um ou mais domínios; um domínio pode ser usado por vários projetos.
- O projeto lista seus domínios na property `domains`; a nota do domínio lista os projetos em `projects` e em `## Projetos`.
- Demandas também preenchem `domains` quando o domínio é conhecido.
- O domínio sobrevive ao projeto. Encerrar um projeto não altera o status do domínio.

## Consulta obrigatória

Antes de interpretar, analisar ou escrever registro de cliente que envolva estrutura do negócio (entidades, estados, relações, regras):

1. Leia o índice `Conhecimento Técnico/<cliente>/Domínios/README.md` e identifique o domínio do trabalho.
2. Leia a nota do domínio e as entidades envolvidas. Use atributos, ciclo de vida e invariantes para interpretar o material.
3. Se o domínio for incerto, pergunte. Não escolha domínio por semelhança de nome.
4. Entidades com `status: proposed` ou `confidence: hypothesis` são incertas: não as trate como fato.

Ao mencionar domínio ou entidade cadastrada em texto do vault, use wikilink para a nota canônica, com as mesmas exceções de literais do [contrato de vocabulário](contrato-de-vocabulario.md).

## Quem alimenta

Toda Skill pode e deve alimentar o domínio quando o trabalho revelar, propor ou alterar estrutura do negócio: entidade nova, atributo, relacionamento, estado, transição ou invariante. Ao concluir o registro principal, chame `/registrar-dominio`.

| Origem | O que costuma alimentar | Status/confiança típicos |
| --- | --- | --- |
| `/analisar-demanda` | Domínio e entidades novos, ou mudanças propostas em entidades existentes. | `proposed`; `reported` ou `hypothesis` |
| `/registrar-reuniao` | Estrutura relatada pelo cliente. | `reported` |
| `/criar-proposta-comercial`, `/criar-projeto` | Domínios usados pelo escopo; vínculo projeto ↔ domínio. | sem mudança de status |
| `/criar-plano-de-implementacao` | Modelo que o plano vai implementar ou alterar. | `proposed` |
| `/documentar-projeto` | Invariantes formalizadas em `RN`; decisões que mudam o modelo. | `confirmed` com evidência |
| `/executar-task`, `/revisar-task`, `/documentar-conhecimento-tecnico` | Confirmação contra o código; vínculo com conhecimento técnico. | `active`/`confirmed` com evidência |
| `/registrar-bug`, `/investigar-bug` | Divergência entre modelo e comportamento. | registrar em `## Questões abertas` |

Não crie entidade para cada substantivo. Entidade é algo que o negócio identifica, acompanha ou cujo estado importa. Valores simples (endereço, período, coordenada) entram como atributo.

## Propostas e mudanças

- Estrutura ainda não confirmada é registrada com `status: proposed` e fonte na demanda, reunião ou plano que a propôs.
- Mudança proposta em entidade `active` não sobrescreve o modelo vigente: registre-a em `## Mudanças propostas` com a fonte. Quando confirmada (plano aprovado, decisão, código entregue), incorpore ao modelo, remova o item e registre na auditoria.
- Proposta rejeitada ou abandonada sai de `## Mudanças propostas` com linha na auditoria explicando o motivo.

## Divergências

Diverge quando o material contradiz atributo, relação, estado, transição ou invariante registrados, ou quando o código se comporta diferente do modelo.

- Pergunte antes de alterar. Não escolha uma versão silenciosamente.
- Sem resposta, registre as duas versões e as fontes em `## Questões abertas` e rebaixe `confidence` quando a anterior não se sustentar.
- Código diferente do modelo é fato operacional, não verdade de negócio: registre a divergência e ligue o conhecimento técnico ou o bug.

## Confiança

Mesma escala do vocabulário: `confirmed` (cliente, Samuel ou documento oficial), `reported` (relatado, não confirmado formalmente) e `hypothesis` (interpretação provável, com dúvida em `## Questões abertas`).

## Status

| `type` | Status | Inicial | Notas |
| --- | --- | --- | --- |
| `domain` | `proposed`, `active`, `deprecated`, `superseded` | `proposed` | `active` quando a fronteira e o propósito forem confirmados. |
| `domain_entity` | `proposed`, `active`, `deprecated`, `superseded` | `proposed` | `active` com evidência (confirmação do cliente, plano aprovado ou código entregue). |

`superseded` exige `superseded_by`. Não apague domínios nem entidades.

## Cumulativo

`## Fontes`, `sources` e a auditoria acumulam todo registro que alimentou o domínio ou a entidade. Toda alteração material atualiza `updated_by`/`updated_at` e acrescenta linha `updated` na auditoria.

## Limites

- Não invente entidade, atributo, cardinalidade, estado ou invariante. Hipótese vai marcada como hipótese.
- Não registre dados reais de pessoas, credenciais, valores de ambiente ou segredos.
- O domínio não substitui regra de negócio, decisão, plano ou documentação técnica.
