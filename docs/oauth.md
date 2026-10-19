# OAuth App do Voyager

O login usa um **OAuth App** do GitHub com escopo `repo` (VO-DEC007). O client secret só existe na function `/api/auth` (`server/oauth.ts`), lida de variável de ambiente; nunca vai ao navegador, ao repositório nem ao vault.

## Desenvolvimento

- App de desenvolvimento: client ID `Ov23liAUPN7IkvVzTfP0`, Callback URL `https://7054.development.ngtools.com.br/auth/callback`.
- Copie `.env.example` para `.env.local` (ignorado pelo git) e preencha `GITHUB_CLIENT_SECRET`.
- `npm run dev` serve as functions `/api/auth/token` e `/api/auth/revoke` pelo próprio Vite (`server/dev-api.ts`), sem Vercel CLI.

## Produção

1. Em GitHub → Settings → Developer settings → OAuth Apps → **New OAuth App**:
   - Homepage URL: `https://<domínio>`
   - Authorization callback URL: `https://<domínio>/auth/callback`
2. Gere um client secret.
3. No projeto da Vercel (Settings → Environment Variables, ambiente Production):
   - `VITE_GITHUB_CLIENT_ID` = client ID do app de produção (vai ao navegador; é público).
   - `GITHUB_CLIENT_ID` = o mesmo client ID.
   - `GITHUB_CLIENT_SECRET` = o secret (marque como Sensitive).
4. Faça um novo deploy para o build ler o `VITE_GITHUB_CLIENT_ID`.

Previews da Vercel têm URLs variáveis e o OAuth App aceita uma única Callback URL; o login nos previews exige um app próprio com o domínio de preview fixo, ou fica restrito à produção.

## Sair

Sair chama `/api/auth/revoke`, que revoga o token no GitHub (`DELETE /applications/{client_id}/token`), e apaga a sessão e a cópia local do vault. Uma chamada seguinte com o mesmo token recebe 401.
