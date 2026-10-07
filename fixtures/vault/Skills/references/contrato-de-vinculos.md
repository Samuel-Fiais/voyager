# Contrato de vínculos

Todo documento do vault que se relaciona com outro tem a **obrigação** de estar ligado a ele. Um registro isolado perde contexto; o vínculo é parte do registro, não um extra.

## Quando ligar

Sempre que houver relação entre documentos, por exemplo:

- reunião ↔ cliente, projeto, task, bug, demanda, proposta ou outra reunião (continuação, retomada, correção);
- task ↔ plano, projeto, bug, revisão, reunião, decisão, regra, conhecimento técnico, repositório;
- bug ↔ task de correção, investigação, reunião, repositório, conhecimento técnico;
- demanda ↔ proposta, projeto, plano, task, bug ou reunião que a originou ou encaminhou;
- domínio ↔ projeto, demanda e repositório; entidade de domínio ↔ termo do vocabulário, regra de negócio, conhecimento técnico e registros que a alimentaram (ver [contrato de domínio](contrato-de-dominio.md));
- padrão de interface ↔ projeto, demanda, repositório e decisão de adoção; padrão de tela ↔ padrão (ver [contrato de design](contrato-de-design.md));
- arquitetura ↔ projeto, demanda, repositório e decisões arquiteturais; componente ↔ arquitetura e repositório (ver [contrato de arquitetura](contrato-de-arquitetura.md));
- qualquer documento ↔ termos do vocabulário do cliente (ver [contrato de vocabulário](contrato-de-vocabulario.md)).

## Como ligar

1. **Pesquise antes de concluir.** Procure documentos relacionados pelo cliente, projeto, códigos citados (`NG-REM002`, `OJ-T003`…), assunto, repositório e termos do vocabulário. Leia os candidatos para confirmar a relação.
2. **Ligue nos dois sentidos.**
   - No documento criado ou alterado: preencha as properties de vínculo (`client`, `project`, `task`, `issue`, `sources` e equivalentes) e a seção de vínculos do modelo (ex.: `## Fontes e vínculos`).
   - No documento relacionado: acrescente o link de volta na seção adequada (`### Reuniões`, `## Reuniões`, `## Documentos relacionados`, `## Fontes` etc.), criando a seção se não existir e sem remover links existentes. Registre `updated` na auditoria do documento relacionado.
3. **Diga a natureza da relação** quando ela não for óbvia: "Continuação de", "Corrige", "Originou", "Evidência de", "Substitui".
4. **Use caminhos que resolvam** (caminho completo quando houver risco de ambiguidade) e confira que cada destino existe antes de finalizar.
5. **Informe no resumo final** quais vínculos foram criados em cada sentido.

## Limites

- Não crie vínculo por suposição. Se a relação for incerta, pergunte.
- Não ligue exemplos, templates ou referências das Skills a registros reais (ver isolamento dos exemplos em [operação compartilhada](operacao-compartilhada.md)). Isso vale também para índices `README.md` e para os `README.md`/`SETUP.md` da raiz: um registro real nunca aponta (wikilink ou link Markdown) para nada em `Skills/` nem para os arquivos de raiz. Quando precisar citar um contrato ou Skill, escreva o caminho ou o comando em código, sem link, por exemplo: `Skills/references/contrato-de-dominio.md` ou `/registrar-dominio`.
- Não altere o conteúdo do documento relacionado além do vínculo e da linha de auditoria, salvo quando o fluxo da Skill exigir.
