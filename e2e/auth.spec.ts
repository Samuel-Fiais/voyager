import { expect, test } from '@playwright/test'

// Fluxo de login com OAuth simulado: o GitHub e a function /api/auth são interceptados.
test('entra pelo GitHub, lista os repositórios e sai revogando o token', async ({ page }) => {
  const calls: string[] = []
  let authorizeUrl = ''

  await page.route('https://github.com/login/oauth/authorize**', async (route) => {
    authorizeUrl = route.request().url()
    const url = new URL(authorizeUrl)
    const back = new URL(url.searchParams.get('redirect_uri')!)
    back.searchParams.set('code', 'codigo-simulado')
    back.searchParams.set('state', url.searchParams.get('state')!)
    await route.fulfill({ status: 302, headers: { location: back.toString() } })
  })
  await page.route('**/api/auth/token', async (route) => {
    calls.push(`token:${route.request().postDataJSON().code}`)
    await route.fulfill({ json: { access_token: 'gho_simulado', scope: 'repo' } })
  })
  await page.route('**/api/auth/revoke', async (route) => {
    calls.push(`revoke:${route.request().postDataJSON().access_token}`)
    await route.fulfill({ status: 204 })
  })
  await page.route('https://api.github.com/user', (route) =>
    route.fulfill({ json: { login: 'samuel-teste', name: 'Samuel Teste', avatar_url: '' } }),
  )
  await page.route('https://api.github.com/user/repos**', (route) => {
    expect(route.request().headers().authorization).toBe('Bearer gho_simulado')
    return route.fulfill({
      json: [
        {
          id: 1,
          full_name: 'samuel-teste/knowledge-base',
          name: 'knowledge-base',
          owner: { login: 'samuel-teste' },
          private: true,
          default_branch: 'main',
          pushed_at: null,
          description: null,
        },
      ],
    })
  })

  await page.goto('/')
  await page.getByTestId('login').click()
  await page.getByTestId('user-menu').click()
  await expect(page.getByTestId('user-login')).toHaveText('samuel-teste')
  await page.getByTestId('user-menu').click()
  expect(new URL(authorizeUrl).searchParams.get('scope')).toBe('repo')
  expect(new URL(authorizeUrl).searchParams.get('client_id')).toBe('e2e-client-id')
  await expect(page.getByText('samuel-teste/knowledge-base')).toBeVisible()
  expect(calls).toEqual(['token:codigo-simulado'])

  const stored = await page.evaluate(() => localStorage.getItem('voyager.session'))
  expect(JSON.parse(stored!).token).toBe('gho_simulado')

  await page.getByTestId('user-menu').click()
  await page.getByTestId('logout').click()
  await expect(page.getByTestId('login')).toBeVisible()
  expect(calls).toEqual(['token:codigo-simulado', 'revoke:gho_simulado'])
  expect(await page.evaluate(() => localStorage.getItem('voyager.session'))).toBeNull()
})

test('o client secret não aparece em nenhuma requisição do navegador', async ({ page }) => {
  const leaks: string[] = []
  page.on('request', (req) => {
    const blob = `${req.url()} ${req.postData() ?? ''} ${JSON.stringify(req.headers())}`
    if (blob.includes('e2e-sentinela-secreta')) leaks.push(req.url())
  })
  page.on('response', async (res) => {
    try {
      if ((await res.text()).includes('e2e-sentinela-secreta')) leaks.push(res.url())
    } catch {
      // respostas sem corpo
    }
  })
  await page.goto('/')
  await page.goto('/design')
  expect(leaks).toEqual([])
})

test('volta com state inválido mostra erro e não entra', async ({ page }) => {
  await page.goto('/auth/callback?code=x&state=forjado')
  await expect(page.getByRole('alert')).toContainText('Estado do login inválido')
  expect(await page.evaluate(() => localStorage.getItem('voyager.session'))).toBeNull()
})
