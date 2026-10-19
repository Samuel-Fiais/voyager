# Contrato de arquitetura

Cada cliente pode ter uma ou mais arquiteturas documentadas. Uma arquitetura descreve um sistema: como ele se divide em componentes, como os componentes se conectam entre si e com sistemas externos, que stack usam, onde os dados ficam e como o sistema é implantado e protegido. A arquitetura existe para que cada projeto, plano ou task não redescubra a estrutura do sistema nem a altere sem decisão.

## Estrutura

```text
Conhecimento Técnico/<cliente>/Arquitetura/
├── README.md                                        ← índice das arquiteturas do cliente
└── <INICIAIS>-ARQ<seq> - <Sistema>/
    ├── <INICIAIS>-ARQ<seq> - <Sistema>.md           ← visão do sistema
    ├── <INICIAIS>-ARQ<seq>-C<seq> - <Componente>.md ← componente com conteúdo próprio
    └── ...
```

- Arquitetura: `<INICIAIS>-ARQ<seq>`, sequência por cliente. Modelo: [documentar-arquitetura/assets/template-arquitetura.md](../documentacao/documentar-arquitetura/assets/template-arquitetura.md).
- Componente: `<código da arquitetura>-C<seq>`, sequência por arquitetura. Modelo: [documentar-arquitetura/assets/template-componente.md](../documentacao/documentar-arquitetura/assets/template-componente.md).
- O índice `README.md` tem uma linha por arquitetura (sistema, propósito, status, projetos).
- Uma arquitetura por sistema, não por projeto: projetos que evoluem o mesmo sistema usam a mesma arquitetura.
- Componente (aplicação, serviço, módulo, banco, fila, armazenamento, integração) ganha nota própria só quando tiver responsabilidade, contrato ou implantação que valha registrar à parte. Os demais ficam na tabela de componentes da arquitetura.

## Fronteira com outros registros

| Registro | Responde | Onde |
| --- | --- | --- |
| Vocabulário | O que a palavra significa. | `Conhecimento Técnico/<cliente>/Vocabulário/` |
| Domínio | O que o negócio guarda e quais regras valem. | `Conhecimento Técnico/<cliente>/Domínios/` |
| Design | Como as telas se apresentam e se comportam. | `Conhecimento Técnico/<cliente>/Design/` |
| Arquitetura | Como o sistema se divide, se conecta, guarda dados e é implantado. | `Conhecimento Técnico/<cliente>/Arquitetura/` |
| Conhecimento técnico | Como o código de um repositório implementa (classes, funções, fluxos). | `Conhecimento Técnico/<cliente>/<repositório>/` |
| Repositório | Contexto permanente para desenvolver, validar e publicar um código. | `Repositorios/<cliente>/` |
| Decisão de projeto | Qual escolha arquitetural o projeto fez e por quê (ADR), e exceções. | `Projetos/<cliente>/<projeto>/Decisões/` |

- A arquitetura registra o que existe ou foi decidido e aponta para a fonte: decisão, código (configuração, `docker-compose`, manifestos, `settings`, rotas da API) ou documento de arquitetura do repositório. Não copia código nem arquivos de configuração inteiros; tabelas com stack, componentes, portas e integrações são permitidas.
- O porquê de cada escolha fica na decisão do projeto; a arquitetura lista as decisões em `## Decisões arquiteturais` e aponta para elas.
- A arquitetura fala de dados em nível de armazenamento e fluxo (qual banco, o que vai para o storage, o que é exportado). Entidades e regras de negócio são domínio; tabelas e campos são conhecimento técnico.
- Diagramas de arquitetura (contexto, componentes, implantação) podem ficar na própria nota em Mermaid ou ser criados com `/criar-diagrama`, sempre coerentes com a nota.
- Quando o código e a nota divergirem, o código é o fato operacional: registre a divergência e atualize a nota ou pergunte.

## Arquiteturas e projetos

- Um projeto usa uma ou mais arquiteturas na property `architectures`; a arquitetura lista os projetos em `projects` e em `## Projetos`.
- Escolhas arquiteturais (stack, componente novo, integração, forma de implantação, exceção à arquitetura) são registradas como decisão do projeto que aponta para a arquitetura.
- Demandas também preenchem `architectures` quando afetam a estrutura técnica do sistema e a arquitetura é conhecida.
- Repositórios que implementam a arquitetura aparecem em `repositories` da arquitetura e, quando houver, em `repository` do componente.
- A arquitetura sobrevive ao projeto; encerrar um projeto não altera o status da arquitetura, mas o encerramento confere se ela reflete o que foi entregue.

## Consulta obrigatória

Antes de propor, planejar, implementar, investigar ou revisar mudança em componentes, integrações, stack, dados, infraestrutura, ambientes ou segurança de um sistema:

1. Leia o índice `Conhecimento Técnico/<cliente>/Arquitetura/README.md` e a arquitetura usada pelo projeto.
2. Siga os componentes, a stack, as integrações e as restrições de implantação registradas; use a fonte no código como referência concreta.
3. Mudança de arquitetura (componente novo, troca de tecnologia, nova integração, novo ambiente) exige decisão do projeto; não altere por conveniência.
4. Arquitetura com `status: proposed` ou `confidence: hypothesis` é incerta: pergunte antes de tratá-la como obrigatória.

Ao mencionar arquitetura ou componente cadastrado em texto do vault, use wikilink para a nota canônica, com as exceções de literais do [contrato de vocabulário](contrato-de-vocabulario.md).

## Quem alimenta

Toda Skill que trabalhe com a estrutura técnica de um sistema pode e deve alimentar a arquitetura quando o trabalho revelar, adotar ou alterar componentes, integrações, stack, dados, infraestrutura ou segurança. Ao concluir o registro principal, chame `/documentar-arquitetura`.

| Origem | O que costuma alimentar |
| --- | --- |
| `/analisar-demanda`, `/criar-projeto`, `/criar-proposta-comercial` | Arquitetura usada ou proposta; vínculo projeto ↔ arquitetura. |
| `/registrar-reuniao`, `/documentar-projeto` | Escolhas arquiteturais; decisão de stack, integração ou implantação. |
| `/criar-plano-de-implementacao`, `/criar-tasks-do-plano` | Componentes e integrações que o plano vai criar ou alterar. |
| `/executar-task`, `/criar-repositorio`, `/documentar-conhecimento-tecnico` | Fonte no código atualizada; componente, porta, ambiente ou dependência nova. |
| `/investigar-bug`, `/criar-correcao-de-bug` | Componentes e integrações envolvidos; fragilidade estrutural descoberta. |
| `/revisar-task`, `/corrigir-revisao` | Conformidade com a arquitetura; divergências encontradas. |
| `/encerrar-projeto` | Conferência de que a arquitetura reflete o que foi entregue. |

## Divergências

Diverge quando o material ou o código contradiz a arquitetura (componente, tecnologia, integração, porta, ambiente, fluxo de dados).

- Pergunte antes de alterar a arquitetura. Não escolha uma versão silenciosamente.
- Sem resposta, registre as duas versões e as fontes em `## Questões abertas` e rebaixe `confidence` quando necessário.
- Em revisão de task, desvio não autorizado é apontamento de revisão, não mudança na arquitetura.

## Confiança

Mesma escala do vocabulário: `confirmed` (cliente, Samuel, decisão ou código entregue), `reported` (relatado, não confirmado) e `hypothesis` (interpretação provável, com dúvida em `## Questões abertas`).

## Status

| `type` | Status | Inicial | Notas |
| --- | --- | --- | --- |
| `architecture` | `proposed`, `active`, `deprecated`, `superseded` | `proposed` | `active` quando adotada por decisão ou implementada em código entregue. |
| `architecture_component` | `proposed`, `active`, `deprecated`, `superseded` | `proposed` | `active` quando existe em código entregue ou foi confirmado. |

`superseded` exige `superseded_by`. Não apague arquiteturas nem componentes.

## Cumulativo

`## Fontes`, `sources` e a auditoria acumulam todo registro que alimentou a arquitetura. Toda alteração material atualiza `updated_by`/`updated_at` e acrescenta linha `updated` na auditoria.

## Limites

- Não invente componente, tecnologia, porta, ambiente ou integração: registre o que está no código, em documento oficial ou foi decidido.
- Não registre credenciais, dados pessoais ou segredos (ex.: senhas, tokens, URLs com credencial, chaves de API).
- A arquitetura não substitui decisão de projeto, domínio, plano ou documentação técnica do código.
