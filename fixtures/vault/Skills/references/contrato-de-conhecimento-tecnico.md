# Contrato de conhecimento técnico

A pasta Conhecimento Técnico é a referência compartilhada para comportamento e estrutura de código que sejam reutilizáveis, relevantes para manutenção ou materialmente arriscados.

Visão de sistema (componentes, stack, integrações, dados em nível de armazenamento, infraestrutura e ambientes) fica na arquitetura, conforme o [contrato de arquitetura](contrato-de-arquitetura.md). O conhecimento técnico detalha como o código de um repositório implementa e aponta para a arquitetura quando o assunto for um componente dela.

## Deduplicação

- Antes de criar um documento, pesquise por repositório, assunto, caminho, símbolo, classe, função, módulo, fluxo e integração relacionados.
- Mantenha um documento canônico por repositório e assunto técnico. Um mesmo documento pode listar vários símbolos quando eles pertencem ao mesmo comportamento ou módulo.
- Se o novo conhecimento ampliar, corrigir ou atualizar um assunto existente, edite o documento canônico e registre a nova fonte, validação ou vínculo de task.
- Crie outro documento apenas quando o escopo for realmente distinto e não puder ser explicado como uma seção do documento existente.
- Ao encontrar documentos sobrepostos, não apague nenhum automaticamente. Identifique o registro canônico, atualize-o e marque o outro como `superseded` com link para o canônico, ou faça uma pergunta se a relação não estiver clara.

## Antes de analisar ou alterar código

1. Procure documentação relacionada ao repositório, módulo, classe, função, fluxo ou integração.
2. Compare a documentação com o código e demais fontes disponíveis.
3. Se houver conflito, trate o código e a evidência atual como fato operacional, registre a divergência e atualize a documentação ou faça uma pergunta antes de tomar decisão de alto impacto.
4. Se não houver documentação relevante, não invente comportamento. Investigue ou faça perguntas.

## Depois de analisar, criar ou alterar código

Crie ou atualize um documento técnico quando o trabalho revelar, criar ou modificar:

- classe, função, módulo ou interface pública;
- fluxo de negócio relevante implementado no código;
- regra de autorização, estado, validação ou tratamento de erro;
- integração, contrato de dados, evento ou dependência importante;
- comportamento que outro agente precisará entender para manter o sistema.

Não crie documentação apenas para mudanças mecânicas, detalhes locais óbvios ou conhecimento que já esteja coberto de forma atual e suficiente. Nesse caso, registre na task que a documentação foi avaliada como não aplicável.

## Qualidade do documento

- Todo comportamento descrito aponta para arquivos, símbolos, testes ou documentos de origem.
- Diferencie fato confirmado, decisão e hipótese.
- Não registre credenciais, segredos ou dados pessoais.
- Um documento técnico não substitui o código, teste, regra de negócio ou decisão canônica.
