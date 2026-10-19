# Publicação na Vercel

O Voyager é um SPA estático com duas functions (`api/auth/token.ts`, `api/auth/revoke.ts`). A Vercel ainda não está ligada (VO-T001/VO-T012: sem credencial na máquina de desenvolvimento).

## Ligar o projeto

1. Em vercel.com → **Add New… → Project**, importe `Samuel-Fiais/voyager` (framework: Vite; build `npm run build`; saída `dist`).
2. Em **Settings → Environment Variables**:
   - `VITE_GITHUB_CLIENT_ID` e `GITHUB_CLIENT_ID`: client ID do OAuth App do ambiente.
   - `GITHUB_CLIENT_SECRET`: secret do OAuth App (marque **Sensitive**).
3. **Production Branch**: `main`. Previews por PR ficam ligados por padrão; o login neles exige um OAuth App com a URL do preview (ver `docs/oauth.md`).
4. Domínio: escolha o domínio de produção, crie o OAuth App de produção com `https://<domínio>/auth/callback` e use as variáveis dele no ambiente Production.

`vercel.json` já traz o rewrite do SPA e os cabeçalhos de segurança (CSP e outros; ver `docs/seguranca.md`).

## Conferir depois do deploy

- `https://<domínio>/design` abre os tokens nos dois temas.
- Entrar, escolher o `knowledge-base`, ler uma nota, mover uma task, editar e criar uma nota (critério da VO-T012).
- Os cabeçalhos: `curl -sI https://<domínio>/ | grep -i content-security-policy`.
