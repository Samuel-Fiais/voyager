# Contrato de design

Cada cliente pode ter um ou mais padrões de interface (design systems): o conjunto de decisões visuais e de interação que várias telas e projetos seguem, como identidade (cores, tipografia, espaçamento, raios, temas), layout base (shell, navegação, cabeçalho), biblioteca de componentes e padrões de tela recorrentes. O padrão existe para que cada projeto não redescubra nem copie o visual de outro.

## Estrutura

```text
Conhecimento Técnico/<cliente>/Design/
├── README.md                                   ← índice dos padrões do cliente
└── <INICIAIS>-DS<seq> - <Padrão>/
    ├── <INICIAIS>-DS<seq> - <Padrão>.md        ← identidade, layout, componentes, fonte no código
    ├── <INICIAIS>-DS<seq>-P<seq> - <Padrão de tela>.md
    └── ...
```

- Padrão: `<INICIAIS>-DS<seq>`, sequência por cliente. Modelo: [registrar-design/assets/template-padrao.md](../documentacao/registrar-design/assets/template-padrao.md).
- Padrão de tela: `<código do padrão>-P<seq>`, sequência por padrão. Modelo: [registrar-design/assets/template-padrao-de-tela.md](../documentacao/registrar-design/assets/template-padrao-de-tela.md).
- O índice `README.md` tem uma linha por padrão (padrão, propósito, status, projetos).
- Padrões de tela só nascem quando uma forma de tela se repete (ex.: listagem com filtros, formulário, detalhe com abas). Não crie um para cada tela.

## Fronteira com outros registros

| Registro | Responde | Onde |
| --- | --- | --- |
| Vocabulário | O que a palavra significa. | `Conhecimento Técnico/<cliente>/Vocabulário/` |
| Domínio | O que o sistema guarda e quais regras valem. | `Conhecimento Técnico/<cliente>/Domínios/` |
| Design | Como as telas se apresentam e se comportam. | `Conhecimento Técnico/<cliente>/Design/` |
| Arquitetura | Como o sistema se divide, se conecta e é implantado (ver [contrato de arquitetura](contrato-de-arquitetura.md)). | `Conhecimento Técnico/<cliente>/Arquitetura/` |
| Conhecimento técnico | Como o código implementa. | `Conhecimento Técnico/<cliente>/<repositório>/` |
| Decisão de projeto | Qual padrão o projeto adota e exceções. | `Projetos/<cliente>/<projeto>/Decisões/` |

- A nota de design registra decisões e aponta para a fonte no código (arquivos de tema, tokens, layout, componentes, `DESIGN.md` do repositório). Não copia CSS nem componentes inteiros; tabelas com os tokens principais são permitidas para leitura rápida.
- Quando o código e a nota divergirem, o código é o fato operacional: registre a divergência e atualize a nota ou pergunte.
- O padrão não define regras de negócio nem o que cada tela faz; isso é domínio, regra ou plano.

## Padrões e projetos

- Um projeto adota um ou mais padrões na property `design_systems`; o padrão lista os projetos em `projects` e em `## Projetos`.
- A decisão de adotar um padrão, e qualquer exceção a ele, é registrada como decisão do projeto que aponta para o padrão.
- Demandas também preenchem `design_systems` quando envolvem interface e o padrão é conhecido.
- O padrão sobrevive ao projeto; encerrar um projeto não altera o status do padrão.

## Consulta obrigatória

Antes de propor, planejar, implementar ou revisar telas de um cliente:

1. Leia o índice `Conhecimento Técnico/<cliente>/Design/README.md` e o padrão adotado pelo projeto.
2. Siga identidade, layout e componentes do padrão; use a fonte no código como referência concreta.
3. Desvio do padrão exige decisão do projeto; não desvie por gosto pessoal.
4. Padrão com `status: proposed` ou `confidence: hypothesis` é incerto: pergunte antes de tratá-lo como obrigatório.

Ao mencionar padrão ou padrão de tela cadastrado em texto do vault, use wikilink para a nota canônica, com as exceções de literais do [contrato de vocabulário](contrato-de-vocabulario.md).

## Quem alimenta

Toda Skill que trabalhe com interface pode e deve alimentar o design quando o trabalho revelar, adotar ou alterar decisões visuais ou padrões de tela. Ao concluir o registro principal, chame `/registrar-design`.

| Origem | O que costuma alimentar |
| --- | --- |
| `/analisar-demanda`, `/criar-projeto` | Padrão adotado; vínculo projeto ↔ padrão. |
| `/registrar-reuniao`, `/documentar-projeto` | Definições visuais do cliente; decisão de adoção ou exceção. |
| `/criar-plano-de-implementacao`, `/criar-tasks-do-plano` | Padrões de tela que o plano vai usar ou criar. |
| `/executar-task`, `/documentar-conhecimento-tecnico` | Fonte no código atualizada; padrão de tela novo que se repetiu. |
| `/revisar-task`, `/corrigir-revisao` | Conformidade com o padrão; divergências encontradas. |

## Divergências

Diverge quando o material ou o código contradiz o padrão (cor, tipografia, layout, componente, comportamento).

- Pergunte antes de alterar o padrão. Não escolha uma versão silenciosamente.
- Sem resposta, registre as duas versões e as fontes em `## Questões abertas` e rebaixe `confidence` quando necessário.
- Em revisão de task, desvio não autorizado é apontamento de revisão, não mudança no padrão.

## Confiança

Mesma escala do vocabulário: `confirmed` (cliente, Samuel ou documento oficial), `reported` (relatado, não confirmado) e `hypothesis` (interpretação provável, com dúvida em `## Questões abertas`).

## Status

| `type` | Status | Inicial | Notas |
| --- | --- | --- | --- |
| `design_system` | `proposed`, `active`, `deprecated`, `superseded` | `proposed` | `active` quando adotado por decisão ou confirmação explícita. |
| `design_pattern` | `proposed`, `active`, `deprecated`, `superseded` | `proposed` | `active` quando usado em entrega ou confirmado. |

`superseded` exige `superseded_by`. Não apague padrões.

## Cumulativo

`## Fontes`, `sources` e a auditoria acumulam todo registro que alimentou o padrão. Toda alteração material atualiza `updated_by`/`updated_at` e acrescenta linha `updated` na auditoria.

## Limites

- Não invente cor, fonte, espaçamento ou comportamento: registre o que está no código, em documento oficial ou foi decidido.
- Não registre credenciais, dados pessoais ou segredos (ex.: URLs com token).
- O design não substitui domínio, regra de negócio, plano ou documentação técnica.
