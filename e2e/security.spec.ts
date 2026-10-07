import { expect, test } from '@playwright/test'
import { fakeGitHub, idbCounts, openWorkspace, signIn } from './support/github'

test('o app funciona sob a CSP de produção, sem violações', async ({ page }) => {
  const violations: string[] = []
  page.on('console', (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text())
  })
  const res = await page.goto('/design')
  expect(res!.headers()['content-security-policy']).toContain("script-src 'self'")
  expect(res!.headers()['referrer-policy']).toBe('no-referrer')
  const gh = await fakeGitHub(page)
  await signIn(page, gh)
  await openWorkspace(page)
  // nota com Mermaid, tabela e imagem da cópia local
  await page.goto(`/?v=${encodeURIComponent('n:Demandas/Acme/AC-D001 - Portal de pedidos.md')}`)
  await expect(page.getByTestId('mermaid').locator('svg')).toBeVisible({ timeout: 15_000 })
  await page.goto(
    `/?v=${encodeURIComponent('n:Projetos/Acme/AC-P001 - Portal de pedidos/Tasks/AC-T001 - Login de clientes/Revisões/AC-T001-REV001 - Login de clientes.md')}`,
  )
  await expect(page.getByTestId('markdown').locator('img')).toHaveAttribute('src', /^blob:/)
  await page.goto('/?v=painel')
  await expect(page.getByTestId('stats')).toBeVisible()
  expect(violations).toEqual([])
})

test('sair apaga sessão, cópia local, abas e recentes, e revoga o token', async ({ page }) => {
  const gh = await fakeGitHub(page)
  await signIn(page, gh)
  await openWorkspace(page)
  await page.goto(`/?v=${encodeURIComponent('n:Clientes/C001 - Acme.md')}`)
  await expect(page.getByTestId('note-header')).toBeVisible()
  await page.evaluate(() => sessionStorage.setItem('voyager.e2e.out', '1'))
  await page.getByTestId('user-menu').click()
  await page.getByTestId('logout').click()
  await expect(page.getByTestId('login')).toBeVisible()
  expect(gh.revoked).toBe(true)
  expect(await idbCounts(page)).toEqual({ workspaces: 0, files: 0 })
  const keys = await page.evaluate(() =>
    Object.keys(localStorage).filter((k) => k.startsWith('voyager.')),
  )
  expect(keys.filter((k) => k !== 'voyager.theme')).toEqual([])
  // o token antigo não vale mais na API
  const status = await page.evaluate(
    async () =>
      (
        await fetch('https://api.github.com/user', {
          headers: { authorization: 'Bearer gho_teste' },
        })
      ).status,
  )
  expect(status).toBe(401)
})
