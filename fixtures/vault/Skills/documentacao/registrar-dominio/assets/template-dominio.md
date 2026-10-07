---
code: "{{client_initials}}-DOM{{sequence}}"
type: domain
status: proposed
client: "[[Clientes/C000 - Client Name|C000 - Client Name]]"
name: "{{domain_name}}"
aliases: []
confidence: reported
projects: []
repositories: []
superseded_by:
sources: []
created_by: "{{actor}}"
created_at: "{{iso8601}}"
updated_by: "{{actor}}"
updated_at: "{{iso8601}}"
---

# {{code}} - {{domain_name}}

## Propósito e fronteira

_Qual parte do negócio este domínio modela, em uma ou duas frases._

- **Dentro:** _o que pertence a este domínio._
- **Fora:** _o que parece relacionado, mas pertence a outro domínio ou a nenhum._

## Entidades

| Entidade | Papel no domínio | Status |
| --- | --- | --- |
| _[[<código>-E001 - Entidade\|Entidade]]_ | _o que ela representa aqui_ | _proposed_ |

## Modelo

```mermaid
erDiagram
    ENTIDADE_A ||--o{ ENTIDADE_B : "relação"
```

## Relação com outros domínios

- _[[<código> - Outro domínio\|Outro domínio]]: o que é fornecido ou consumido e como os termos se traduzem._

Remova esta seção quando não houver dependência entre domínios.

## Projetos

- _Projetos que usam ou alteram este domínio._

## Questões abertas

- _Dúvida sobre fronteira ou modelo, quando `confidence` não for `confirmed`._

## Fontes

- _Demanda, reunião, plano, task ou documento que alimentou o domínio._

## Auditoria

- `{{iso8601}}` | {{actor}} | created | — | proposed | criação do domínio
