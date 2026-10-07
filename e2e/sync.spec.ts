import { expect, test } from '@playwright/test'
import { loadFixtureVault } from '../testing/fixture-vault'
import { fakeGitHub, idbCounts, openWorkspace, signIn } from './support/github'

const fixture = Object.keys(loadFixtureVault()).filter(
  (p) => !p.startsWith('.obsidian/') && !p.startsWith('.trash/'),
)
const NOTES = fixture.filter((p) => p.endsWith('.md')).length
const BINARIES = fixture.filter((p) => p.endsWith('.png')).length

test('abre o vault, sincroniza só o que mudou, troca de workspace e sai limpando a cópia', async ({
  page,
}) => {
  const gh = await fakeGitHub(page, { branches: ['main', 'rascunho'] })
  await signIn(page, gh)
  await openWorkspace(page)
  await page.goto('/?v=arquivos')

  await expect(page.getByTestId('count-Notas')).toHaveText(String(NOTES))
  await expect(page.getByTestId('count-Anexos')).toHaveText(String(BINARIES))
  await expect(page.getByTestId('count-Último commit')).toHaveText(gh.head().sha.slice(0, 7))

  // Commit de agente na main aparece após sincronizar, baixando só o arquivo novo.
  await gh.externalCommit({ 'Demandas/Acme/AC-D003 - Nova.md': '# nova\n' }, 'commit de agente')
  gh.calls.length = 0
  await page.getByTestId('sync').click()
  await expect(page.getByTestId('count-Notas')).toHaveText(String(NOTES + 1))
  await expect(page.getByText(/1 novos, 0 alterados, 0 removidos/)).toBeVisible()
  expect(gh.calls.filter((c) => c === 'POST /graphql')).toHaveLength(1)

  // Segundo workspace na branch rascunho; a cópia da main continua.
  const before = await idbCounts(page)
  await page.getByTestId('workspace-switcher').click()
  await page.getByRole('menuitem', { name: 'Adicionar workspace' }).click()
  await openWorkspace(page, 'rascunho', { navigate: false })
  await expect(page.getByTestId('workspace-switcher')).toContainText('rascunho')
  const after = await idbCounts(page)
  expect(after.workspaces).toBe(2)
  expect(after.files).toBe(before.files + fixture.length)

  await page.getByTestId('workspace-switcher').click()
  await page.getByRole('menuitemradio', { name: /vault-sintetico main/ }).click()
  await page.goto('/?v=arquivos')
  await expect(page.getByTestId('count-Notas')).toHaveText(String(NOTES + 1))

  // Sair revoga o token e apaga a cópia local.
  await page.evaluate(() => sessionStorage.setItem('voyager.e2e.out', '1'))
  await page.getByTestId('user-menu').click()
  await page.getByTestId('logout').click()
  await expect(page.getByTestId('login')).toBeVisible()
  expect(gh.revoked).toBe(true)
  expect(await idbCounts(page)).toEqual({ workspaces: 0, files: 0 })
})

test('mostra erro de acesso quando o token deixa de valer', async ({ page }) => {
  const gh = await fakeGitHub(page)
  await signIn(page, gh)
  await openWorkspace(page)
  gh.revoked = true
  await page.getByTestId('sync').click()
  await expect(page.getByTestId('sync-status')).toHaveClass(/text-nasa/)
})
