#!/usr/bin/env python3
# Validador de frontmatter, auditoria e vínculos das notas canônicas do vault.
# Fonte de verdade: Skills/references/contrato-de-frontmatter.md, contrato-de-status-de-entidades.md,
# contrato-de-status-de-tasks.md, contrato-de-auditoria.md, contrato-de-vinculos.md e os templates em Skills/*/*/assets/.
#
# Uso (a partir de qualquer pasta):
#   python3 Skills/scripts/validar-vault.py            # valida o vault inteiro
#   python3 Skills/scripts/validar-vault.py --staged   # vault inteiro + regras de alteração (append-only) nos arquivos staged
#   python3 Skills/scripts/validar-vault.py --report   # relatório por type (quantidade e status), sem falhar
# Sai com código 1 quando houver erro. O hook .githooks/pre-commit e o workflow do GitHub rodam este script.
import os, re, sys, subprocess, unicodedata, collections, urllib.parse

try:
    import yaml
except ImportError:
    sys.exit("validar-vault: instale PyYAML (pip install pyyaml)")

KB = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
os.chdir(KB)
N = lambda s: unicodedata.normalize("NFC", s)
SKIP_DIRS = {".git", ".obsidian", ".trash", "Skills", "node_modules"}
NO_FM_ALLOWED = {"README.md", "SETUP.md"}  # índices e documentos de raiz podem ficar sem frontmatter
AUDIT_PROPS = ["created_by", "created_at", "updated_by", "updated_at"]
ISO = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})$")
AGENT = re.compile(r"^agent:[a-z0-9][a-z0-9_-]*$")
AUDIT_LINE = re.compile(r"^- `([^`]+)` \| ([^|]+?) \| ")
# Types cujo code não segue o nome do arquivo (arquivo de caminho fixo).
FIXED_PATH_TYPES = {"task_provider_configuration"}
# Checklists internos das Skills (não viram nota no vault).
SKILL_ONLY_TYPES = {"status_change_checklist", "sync_checklist"}
ROOT_DOCS = {"README.md", "SETUP.md"}
# Padrões de code previstos em SKILL.md além do template (criar-diagrama: diagrama geral usa DIA001).
EXTRA_CODE_PATTERNS = {"diagram": r"^DIA\d{3,}$"}


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def split_fm(text):
    m = re.match(r"^---\n(.*?)\n---\n?", text, re.S)
    return (m.group(1), text[m.end():]) if m else (None, text)


def raw_values(fm):
    out = {}
    for line in fm.splitlines():
        m = re.match(r"^([A-Za-z_][\w-]*):[ \t]*(.*)$", line)
        if m:
            out[m.group(1)] = m.group(2).rstrip()
    return out


# ---------- contratos ----------
def backticked(cell):
    return re.findall(r"`([^`]+)`", cell)


def load_contract():
    """type -> set(status) lido das tabelas dos contratos de status."""
    allowed = {}
    task_status = set()
    for line in read("Skills/references/contrato-de-status-de-tasks.md").splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if line.startswith("|") and len(cells) >= 2 and backticked(cells[0]) and not cells[0].startswith("Status"):
            task_status.update(backticked(cells[0]))
    for line in read("Skills/references/contrato-de-status-de-entidades.md").splitlines():
        if not line.startswith("| `"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        types, statuses = backticked(cells[0]), backticked(cells[1])
        if "contrato de tasks" in cells[1]:
            statuses = sorted(task_status)
        for t in types:
            allowed.setdefault(t, set()).update(statuses)
    return allowed


def load_code_patterns():
    """type -> lista de regex de code derivadas dos templates das Skills."""
    pats = collections.defaultdict(list)
    for dp, _, fn in os.walk("Skills"):
        if not dp.endswith("/assets"):
            continue
        for f in fn:
            if not f.endswith(".md") or f.startswith("exemplo"):
                continue
            fm, _ = split_fm(read(os.path.join(dp, f)))
            if not fm:
                continue
            rv = raw_values(fm)
            t, c = rv.get("type", "").strip('"'), rv.get("code", "").strip('"')
            if not t or not c:
                continue
            rx, pos = "", 0
            for m in re.finditer(r"\{\{(\w+)\}\}", c):
                rx += re.escape(c[pos:m.start()])
                name = m.group(1)
                rx += r"\d{3,}" if name == "sequence" else (r"[A-Z][A-Z0-9]{1,4}" if name == "client_initials" else r"[A-Z0-9]+(?:-[A-Z0-9]+)*")
                pos = m.end()
            rx += re.escape(c[pos:])
            pats[t].append("^" + rx + "$")
    for t, rx in EXTRA_CODE_PATTERNS.items():
        pats[t].append(rx)
    return pats


# ---------- arquivos ----------
def walk_notes():
    notes, files = [], []
    for dp, dn, fn in os.walk("."):
        rel = os.path.relpath(dp, ".")
        top = rel.split(os.sep)[0]
        dn[:] = [d for d in dn if d not in {".git", ".obsidian", ".trash", "node_modules"}]
        for f in fn:
            p = N(os.path.normpath(os.path.join(rel, f)))
            files.append(p)
            if f.endswith(".md") and top not in SKIP_DIRS:
                notes.append(p)
    return sorted(notes), files


def strip_code(text):
    text = re.sub(r"^```.*?^```", "", text, flags=re.S | re.M)
    return re.sub(r"`[^`\n]*`", "", text)


def build_index(files):
    by_path, by_name = set(), collections.defaultdict(list)
    for p in files:
        by_path.add(p)
        if p.endswith(".md"):
            by_path.add(p[:-3])
        base = os.path.basename(p)
        by_name[base].append(p)
        if base.endswith(".md"):
            by_name[base[:-3]].append(p)
    return by_path, by_name


def resolve_wikilink(target, note, by_path, by_name):
    t = N(target.split("#")[0].split("^")[0].strip().rstrip("\\"))
    if not t:
        return "self"
    if t in by_path:
        return t
    rel = os.path.normpath(os.path.join(os.path.dirname(note), t))
    if rel in by_path:
        return rel
    hits = by_name.get(os.path.basename(t), [])
    if hits and ("/" not in t or any(h.endswith(t) or h.endswith(t + ".md") for h in hits)):
        return hits[0]
    return None


def links_of(text):
    clean = strip_code(text)
    wl = [m.group(1).split("|")[0] for m in re.finditer(r"!?\[\[([^\]\n]+?)\]\]", clean)]
    md = [m.group(1) for m in re.finditer(r"\]\(([^)\s]+)\)", clean)]
    return wl, md


def audit_lines(body):
    m = re.search(r"^## Auditoria[ \t]*\n(.*?)(?=^#{1,2} |\Z)", body, re.S | re.M)
    if not m:
        return None
    return [l.rstrip() for l in m.group(1).splitlines() if l.startswith("- ")]


# ---------- validação ----------
def validate(notes, files, allowed, code_pats):
    errors, report = [], collections.defaultdict(collections.Counter)
    by_path, by_name = build_index(files)
    err = lambda p, msg: errors.append(f"{p}: {msg}")
    codes = collections.defaultdict(list)
    for p in notes:
        text = read(p)
        fm, body = split_fm(text)
        base = os.path.basename(p)
        wl, md = links_of(text)
        for t in wl:
            r = resolve_wikilink(t, p, by_path, by_name)
            if r is None:
                err(p, f"wikilink quebrado [[{t}]]")
            elif r != "self" and p not in ROOT_DOCS and (r.startswith("Skills/") or r in ROOT_DOCS):
                err(p, f"registro real não pode ligar a Skills/ nem à raiz: [[{t}]] (contrato de vínculos)")
        for t in md:
            # "/FIA/issues/..." são caminhos de outro sistema (Paperclip), sem host; não são arquivos do vault.
            if re.match(r"^(https?:|mailto:|#|obsidian:|/)", t):
                continue
            dest = N(os.path.normpath(os.path.join(os.path.dirname(p), urllib.parse.unquote(t.split("#")[0]))))
            if dest not in by_path:
                err(p, f"link Markdown quebrado ({t})")
            elif p not in ROOT_DOCS and (dest.startswith("Skills/") or dest in ROOT_DOCS):
                err(p, f"registro real não pode ligar a Skills/ nem à raiz: ({t}) (contrato de vínculos)")
        if fm is None:
            if base not in NO_FM_ALLOWED:
                err(p, "sem frontmatter (só README.md e SETUP.md podem ficar sem); se for resíduo de exportação, remova")
            continue
        try:
            data = yaml.safe_load(fm) or {}
            if not isinstance(data, dict):
                raise ValueError("frontmatter não é um mapa")
        except Exception as e:
            err(p, f"frontmatter YAML inválido: {str(e).splitlines()[0]}")
            continue
        rv = raw_values(fm)
        typ, status = data.get("type"), data.get("status")
        report[str(typ)][str(status)] += 1
        for k in ("type", "status"):
            if rv.get(k, "")[:1] in ("'", '"'):
                err(p, f"{k} entre aspas ({rv[k]}); use valor sem aspas")
        if not typ:
            err(p, "sem type")
            continue
        if typ not in allowed:
            err(p, f"type '{typ}' fora do contrato de status de entidades")
        elif status is None:
            err(p, f"sem status (permitidos para {typ}: {', '.join(sorted(allowed[typ]))})")
        elif str(status) not in allowed[typ]:
            err(p, f"status '{status}' não permitido para {typ} (permitidos: {', '.join(sorted(allowed[typ]))})")
        code = data.get("code")
        if not code:
            err(p, "sem code")
        else:
            code = str(code)
            codes[code].append(p)
            if typ not in FIXED_PATH_TYPES and not (base == f"{code}.md" or base.startswith(f"{code} - ")):
                err(p, f"nome do arquivo não começa com o code '{code} - '")
            if code_pats.get(typ) and not any(re.match(rx, code) for rx in code_pats[typ]):
                err(p, f"code '{code}' fora do padrão do template de {typ}")
        for k in AUDIT_PROPS:
            v = rv.get(k, "").strip().strip('"').strip("'")
            if not v:
                err(p, f"sem {k} (contrato de auditoria)")
            elif k.endswith("_at") and not ISO.match(v):
                err(p, f"{k} '{v}' não é ISO 8601 com timezone")
            elif k.endswith("_by") and v.startswith("agent:") and not AGENT.match(v):
                err(p, f"{k} '{v}' inválido: use agent:<nome-em-minúsculas>")
        al = audit_lines(body)
        if al is None:
            err(p, "sem seção ## Auditoria")
        elif not al:
            err(p, "## Auditoria sem nenhuma linha")
    for c, ps in codes.items():
        if len(ps) > 1:
            err(ps[0], f"code '{c}' duplicado em: {'; '.join(ps[1:])}")
    return errors, report


def validate_skills(allowed, code_pats):
    """Templates, exemplos e SKILL.md não podem ensinar type/status fora do contrato."""
    errors = []
    for dp, _, fn in os.walk("Skills"):
        for f in fn:
            p = os.path.join(dp, f)
            if not f.endswith(".md"):
                continue
            text = read(p)
            if dp.endswith("/assets"):
                fm, _ = split_fm(text)
                if fm is None:
                    continue
                rv = raw_values(fm)
                t, st = rv.get("type", "").strip('"'), rv.get("status", "").strip('"')
                if not t:
                    continue
                if t in SKILL_ONLY_TYPES:
                    continue
                if t not in allowed:
                    errors.append(f"{p}: template/exemplo usa type '{t}' fora do contrato de status de entidades")
                elif not st:
                    errors.append(f"{p}: template/exemplo sem status (permitidos para {t}: {', '.join(sorted(allowed[t]))})")
                elif "{{" not in st and st not in allowed[t]:
                    errors.append(f"{p}: template/exemplo usa status '{st}' não permitido para {t}")
                for k in ("type", "status"):
                    if rv.get(k, "")[:1] in ("'", '"'):
                        errors.append(f"{p}: {k} entre aspas no template/exemplo")
                c = rv.get("code", "").strip('"')
                if f.startswith("exemplo") and c and code_pats.get(t) and not any(re.match(rx, c) for rx in code_pats[t]):
                    errors.append(f"{p}: exemplo com code '{c}' fora do padrão do template de {t}")
            elif f == "SKILL.md":
                for m in re.finditer(r"\btype: ?`?([a-z_]+)`?", text):
                    if m.group(1) not in allowed and m.group(1) not in SKILL_ONLY_TYPES:
                        errors.append(f"{p}: cita type '{m.group(1)}' fora do contrato de status de entidades")
    return errors


def git(*args):
    return subprocess.run(["git", *args], capture_output=True, text=True).stdout


def validate_staged():
    """Regras de alteração: ## Auditoria append-only, linha nova a cada alteração, ator válido."""
    errors = []
    out = git("-c", "core.quotepath=off", "diff", "--cached", "--name-status", "-M", "--diff-filter=MR")
    for line in out.splitlines():
        parts = line.split("\t")
        old, new = parts[1], parts[-1]
        if not new.endswith(".md") or new.split("/")[0] in SKIP_DIRS:
            continue
        before, after = git("show", f"HEAD:{old}"), git("show", f":{new}")
        fb, bb = split_fm(before)
        fa, ba = split_fm(after)
        la, lb = audit_lines(ba) or [], audit_lines(bb) or []
        if lb and la[:len(lb)] != lb:
            errors.append(f"{new}: ## Auditoria é append-only; linha antiga apagada, alterada ou reordenada")
            continue
        added = la[len(lb):]
        if fb is not None and fa is not None and before != after:
            if not added:
                errors.append(f"{new}: alterado sem nova linha em ## Auditoria (contrato de auditoria)")
            ra, rb = raw_values(fa), raw_values(fb)
            if ra.get("updated_at") == rb.get("updated_at") and added:
                errors.append(f"{new}: updated_at não foi atualizado")
        for l in added:
            m = AUDIT_LINE.match(l)
            if not m:
                errors.append(f"{new}: linha de auditoria fora do formato `quando` | quem | ação | de | para | nota: {l[:80]}")
            elif not ISO.match(m.group(1)):
                errors.append(f"{new}: quando '{m.group(1)}' não é ISO 8601 com timezone")
            elif m.group(2).startswith("agent:") and not AGENT.match(m.group(2)):
                errors.append(f"{new}: ator '{m.group(2)}' inválido: use agent:<nome-em-minúsculas>")
    return errors


def main():
    notes, files = walk_notes()
    allowed, code_pats = load_contract(), load_code_patterns()
    errors, report = validate(notes, files, allowed, code_pats)
    errors += validate_skills(allowed, code_pats)
    if "--staged" in sys.argv:
        errors += validate_staged()
    if "--report" in sys.argv:
        for t in sorted(report):
            perm = allowed.get(t)
            print(f"{t}: {sum(report[t].values())} | " + ", ".join(f"{s}={n}" + ("" if perm is None or s in perm else " (fora)") for s, n in sorted(report[t].items())))
        print(f"\n{len(errors)} erro(s)")
        for e in errors:
            print("  - " + e)
        return 0
    if errors:
        print(f"validar-vault: {len(errors)} erro(s)")
        for e in errors:
            print("  - " + e)
        print("Corrija pelo contrato/template da Skill; não use --no-verify.")
        return 1
    print(f"validar-vault: ok ({len(notes)} notas)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
