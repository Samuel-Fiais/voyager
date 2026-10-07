#!/usr/bin/env python3
"""Gera as notas fictícias do vault sintético (fixtures/vault), sem dados de clientes reais.

Os contratos, templates e o validar-vault.py em fixtures/vault/Skills são cópias das Skills do vault real.
Rode a partir da raiz do repositório: python3 scripts/gerar-vault-sintetico.py
"""
import base64, os, shutil

V = "fixtures/vault"
P = "Projetos/Acme/AC-P001 - Portal de pedidos"
PL = f"[[{P}/AC-P001 - Portal de pedidos|AC-P001 - Portal de pedidos]]"
CL = "[[Clientes/C001 - Acme|C001 - Acme]]"
IP = f"[[{P}/Planos de Implementação/AC-IP001 - MVP do portal|AC-IP001 - MVP do portal]]"
RL = "[[Repositorios/Acme/AC-R001 - portal|AC-R001 - portal]]"


def w(path, text):
    full = os.path.join(V, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(text.lstrip("\n"))


def audit(*lines):
    return "## Auditoria\n\n" + "".join(f"- `{t}` | {who} | {a} | {de} | {para} | {ev}\n" for t, who, a, de, para, ev in lines)


for d in ("Clientes", "Demandas", "Projetos", "Repositorios", "Conhecimento Técnico", ".obsidian", ".trash"):
    shutil.rmtree(os.path.join(V, d), ignore_errors=True)

w("README.md", "# Vault sintético\n\nVault fictício usado nos testes do Voyager. Nenhum dado é real.\n")
w(".obsidian/app.json", '{"theme": "obsidian"}\n')
w(".trash/Rascunho apagado.md", "---\ncode: \"AC-D999\"\n---\n\nnota na lixeira\n")

w("Clientes/C001 - Acme.md", f"""
---
code: C001
type: company
engagement: client
status: active
aliases:
  - AC
created_by: "Samuel Fiais"
created_at: "2026-09-01T09:00:00-03:00"
updated_by: "agent:claude"
updated_at: "2026-09-20T10:00:00-03:00"
---

## Resumo

Empresa fictícia de comércio, usada no vault sintético do Voyager.

## Documentos relacionados

- [[Demandas/Acme/AC-D001 - Portal de pedidos|AC-D001 - Portal de pedidos]] (demanda)
- {PL} (projeto)
- {RL} (repositório)

{audit(("2026-09-01T09:00:00-03:00", "Samuel Fiais", "created", "—", "active", "cadastro inicial"),
       ("2026-09-20T10:00:00-03:00", "agent:claude", "updated", "active", "active", "projeto ligado"))}""")

w("Repositorios/Acme/AC-R001 - portal.md", f"""
---
code: AC-R001
type: repository
client: "{CL}"
provider: github
url: https://github.com/acme/portal
default_branch: main
status: active
created_by: "agent:claude"
created_at: "2026-09-05T11:00:00-03:00"
updated_by: "agent:claude"
updated_at: "2026-09-05T11:00:00-03:00"
---

## Resumo

Código do portal de pedidos da Acme.

## Planos relacionados

- {IP}

{audit(("2026-09-05T11:00:00-03:00", "agent:claude", "created", "—", "active", "cadastro do repositório"))}""")

w("Demandas/Acme/AC-D001 - Portal de pedidos.md", f"""
---
code: "AC-D001"
type: demand
status: ready
routing: implementation_plan
client: "{CL}"
project: "{PL}"
repository: "{RL}"
domains: []
design_systems: []
architectures: []
created_by: "Samuel Fiais"
created_at: "2026-09-02T14:00:00-03:00"
updated_by: "agent:claude"
updated_at: "2026-09-04T16:30:00-03:00"
---

## Pedido e problema

A Acme recebe pedidos por e-mail e planilha. Quer um **portal de pedidos** com catálogo, carrinho e pagamento.

## Resultado esperado

- [x] Clientes fazem pedidos sem e-mail.
- [ ] Pagamento aprovado em até 1 minuto.

## Contexto e evidências

| Canal | Pedidos por mês | Erros |
| --- | ---: | ---: |
| E-mail | 320 | 41 |
| Planilha | 120 | 9 |

```mermaid
flowchart LR
  cliente([Cliente]) --> portal[Portal] --> erp[(ERP)]
```

Ver o projeto {PL} e a [[Clientes/C001 - Acme|ficha da Acme]].

## Impacto e risco

Atrasos de entrega por pedidos digitados errado.

## Perguntas abertas

- Qual gateway de pagamento?

## Encaminhamento

`implementation_plan`: escopo claro e aprovado.

{audit(("2026-09-02T14:00:00-03:00", "Samuel Fiais", "created", "—", "discovered", "pedido recebido por e-mail"),
       ("2026-09-03T09:10:00-03:00", "agent:claude", "status_change", "discovered", "needs_clarification", "falta definir o gateway"),
       ("2026-09-04T16:30:00-03:00", "agent:claude", "status_change", "needs_clarification", "ready", "Samuel confirmou o escopo"))}""")

w("Demandas/Acme/AC-D002 - Relatório de vendas.md", f"""
---
code: "AC-D002"
type: demand
status: discovered
routing: investigation
client: "{CL}"
project:
repository:
domains: []
design_systems: []
architectures: []
created_by: "Samuel Fiais"
created_at: "2026-09-25T08:00:00-03:00"
updated_by: "Samuel Fiais"
updated_at: "2026-09-25T08:00:00-03:00"
---

## Pedido e problema

Relatório semanal de vendas por região.

## Encaminhamento

`investigation`.

{audit(("2026-09-25T08:00:00-03:00", "Samuel Fiais", "created", "—", "discovered", "pedido por telefone"))}""")

TASKS = [
    # code, nome, status, pr_status, created, auditoria extra
    ("AC-T001", "Login de clientes", "done", "merged", "2026-09-06T10:00:00-03:00",
     [("2026-09-07T09:00:00-03:00", "agent:claude", "status_change", "planned", "in_progress", "AC-T001-IMP001"),
      ("2026-09-09T18:00:00-03:00", "agent:claude", "status_change", "in_progress", "in_review", "PR #1"),
      ("2026-09-10T11:00:00-03:00", "agent:claude-revisor", "status_change", "in_review", "done", "AC-T001-REV001 approved")]),
    ("AC-T002", "Catálogo de produtos", "in_review", "open", "2026-09-06T10:05:00-03:00",
     [("2026-09-11T09:00:00-03:00", "agent:claude", "status_change", "planned", "in_progress", "AC-T002-IMP001"),
      ("2026-09-15T17:00:00-03:00", "agent:claude", "status_change", "in_progress", "in_review", "PR #2")]),
    ("AC-T003", "Carrinho", "in_progress", "not_created", "2026-09-06T10:10:00-03:00",
     [("2026-09-16T09:00:00-03:00", "agent:claude", "status_change", "planned", "in_progress", "AC-T003-IMP001")]),
    ("AC-T004", "Pagamento", "blocked", "not_created", "2026-09-06T10:15:00-03:00",
     [("2026-09-17T09:00:00-03:00", "agent:claude", "status_change", "planned", "blocked", "gateway de pagamento não definido")]),
    ("AC-T005", "Relatórios", "planned", "not_created", "2026-09-06T10:20:00-03:00", []),
    ("AC-T006", "Exportação de pedidos", "ready", "not_created", "2026-09-06T10:25:00-03:00",
     [("2026-09-18T09:00:00-03:00", "agent:claude", "status_change", "planned", "ready", "dependências aprovadas")]),
]

task_links = []
for code, nome, status, prs, created, extra in TASKS:
    d = f"{P}/Tasks/{code} - {nome}"
    rel = f"{d}/{code} - {nome}"
    task_links.append(f"- [[{rel}|{code} - {nome}]]")
    last = extra[-1][0] if extra else created
    last_by = extra[-1][1] if extra else "agent:claude"
    imp = f"[[{d}/Implementação/{code}-IMP001 - {nome}|{code}-IMP001]]"
    rev = f"[[{d}/Revisões/{code}-REV001 - {nome}|{code}-REV001]]"
    evidence = []
    if status in ("in_progress", "in_review", "done"):
        evidence.append(imp)
    if status == "done":
        evidence.append(rev)
    ev_yaml = "[]" if not evidence else "\n" + "".join(f'  - "{e}"\n' for e in evidence).rstrip("\n")
    w(f"{rel}.md", f"""
---
code: "{code}"
type: task
status: {status}
project: "{PL}"
implementation_plan: "{IP}"
origin_issue:
dependencies: []
repository: "{RL}"
branch:
branch_url:
pull_request:
pull_request_url:
pull_request_status: {prs}
knowledge_documents: []
knowledge_status: {"updated" if status == "done" else "not_assessed"}
status_evidence: {ev_yaml}
created_by: "agent:claude"
created_at: "{created}"
updated_by: "{last_by}"
updated_at: "{last}"
---

## Objetivo

{nome} no portal de pedidos.

## Critérios de aceite

- [ ] {nome} funciona de ponta a ponta.

## Dependências e impedimentos

{"Gateway de pagamento não definido." if status == "blocked" else "Nenhuma."}

## Documentos da task

### Implementação

- {imp if status in ("in_progress", "in_review", "done") else "_Nenhum registro._"}

### Revisões

- {rev if status == "done" else "_Revisão obrigatória antes da conclusão._"}

{audit(("" + created, "agent:claude", "created", "—", "planned", "criação a partir do AC-IP001"), *extra)}""")
    if status in ("in_progress", "in_review", "done"):
        imp_status = {"in_progress": "in_progress", "in_review": "in_review", "done": "done"}[status]
        w(f"{d}/Implementação/{code}-IMP001 - {nome}.md", f"""
---
code: "{code}-IMP001"
type: implementation_record
task: "[[{rel}|{code} - {nome}]]"
status: {imp_status}
branch:
branch_url:
pull_request:
pull_request_url:
date: "{extra[0][0][:10]}"
created_by: "agent:claude"
created_at: "{extra[0][0]}"
updated_by: "agent:claude"
updated_at: "{extra[0][0]}"
---

## Objetivo executado

{nome}.

{audit((extra[0][0], "agent:claude", "created", "—", imp_status, "início da execução"))}""")
    if status == "done":
        w(f"{d}/Revisões/{code}-REV001 - {nome}.md", f"""
---
code: "{code}-REV001"
type: review_record
task: "[[{rel}|{code} - {nome}]]"
status: approved
review_date: "2026-09-10"
pull_request:
pull_request_url:
pull_request_status: approved
created_by: "agent:claude-revisor"
created_at: "2026-09-10T11:00:00-03:00"
updated_by: "agent:claude-revisor"
updated_at: "2026-09-10T11:00:00-03:00"
---

## Resultado

Aprovado sem achados. ![[login.png]]

{audit(("2026-09-10T11:00:00-03:00", "agent:claude-revisor", "created", "—", "approved", "parecer da revisão"))}""")
        png = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==")
        os.makedirs(os.path.join(V, d, "Evidências"), exist_ok=True)
        with open(os.path.join(V, d, "Evidências", "login.png"), "wb") as f:
            f.write(png)

w(f"{P}/Planos de Implementação/AC-IP001 - MVP do portal.md", f"""
---
code: "AC-IP001"
type: implementation_plan
status: approved
project: "{PL}"
commercial_proposal:
repository: "{RL}"
created_by: "agent:claude"
created_at: "2026-09-05T15:00:00-03:00"
updated_by: "agent:claude"
updated_at: "2026-09-06T10:00:00-03:00"
---

## Contexto e objetivo

MVP do portal de pedidos.

{audit(("2026-09-05T15:00:00-03:00", "agent:claude", "created", "—", "draft", "rascunho"),
       ("2026-09-06T10:00:00-03:00", "agent:claude", "status_change", "draft", "approved", "aprovado por Samuel"))}""")

w(f"{P}/Decisões/AC-DEC001 - Gateway de pagamento.md", f"""
---
code: "AC-DEC001"
type: decision
project: "{PL}"
status: proposed
decision_date: "2026-09-17"
created_by: "agent:claude"
created_at: "2026-09-17T09:30:00-03:00"
updated_by: "agent:claude"
updated_at: "2026-09-17T09:30:00-03:00"
---

## Contexto

O pagamento depende do gateway.

{audit(("2026-09-17T09:30:00-03:00", "agent:claude", "created", "—", "proposed", "registro da pendência"))}""")

w(f"{P}/AC-P001 - Portal de pedidos.md", f"""
---
code: "AC-P001"
type: project
status: active
client: "{CL}"
commercial_proposal:
repositories:
  - "{RL}"
domains: []
design_systems: []
architectures: []
start_date: "2026-09-05"
target_date:
end_date:
created_by: "agent:claude"
created_at: "2026-09-05T14:00:00-03:00"
updated_by: "agent:claude"
updated_at: "2026-09-06T10:30:00-03:00"
---

## Objetivo

Portal de pedidos da Acme.

## Acompanhamento

```query
title: Tasks em aberto
type: task
project: AC-P001
status: [in_progress, in_review, blocked]
columns: [code, title, status]
```

```chart
title: Tasks por status
type: task
project: AC-P001
by: status
```

```kanban
type: task
project: AC-P001
```

## Links do projeto

### Planos de implementação

- {IP}

### Decisões

- [[{P}/Decisões/AC-DEC001 - Gateway de pagamento|AC-DEC001 - Gateway de pagamento]]

### Tasks

{chr(10).join(task_links)}

{audit(("2026-09-05T14:00:00-03:00", "agent:claude", "created", "—", "planning", "criação"),
       ("2026-09-06T10:30:00-03:00", "agent:claude", "status_change", "planning", "active", "tasks criadas"))}""")

print("vault sintético gerado em", V)
