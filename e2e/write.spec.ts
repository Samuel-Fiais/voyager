import { expect, test } from '@playwright/test'
import { fakeGitHub, openWorkspace, signIn } from './support/github'

const P = 'Projetos/Acme/AC-P001 - Portal de pedidos/Tasks'
const T3 = `${P}/AC-T003 - Carrinho/AC-T003 - Carrinho.md`
const T2 = `${P}/AC-T002 - Catálogo de produtos/AC-T002 - Catálogo de produtos.md`
const open = (path: string) => `/?v=${encodeURIComponent(`n:${path}`)}`

test('mudar status mostra diff, auditoria e commit; grava um commit e sincroniza', async ({
  page,
}) => {
  const gh = await fakeGitHub(page)
  await signIn(page, gh)
  await openWorkspace(page)
  await page.goto(open(T3))
  const commits = gh.commits.size

  await page.getByTestId('status-button').click()
  await page.getByTestId('status-menu').locator('[data-status="blocked"]').click()
  const sheet = page.getByTestId('commit-sheet')
  await expect(sheet).toContainText('AC-T003: in_progress → blocked')
  await expect(page.getByTestId('commit-diff')).toContainText('- status: in_progress')
  await expect(page.getByTestId('commit-diff')).toContainText('+ status: blocked')
  await expect(page.getByTestId('commit-diff')).toContainText('+ updated_by: "Samuel Fiais"')
  // motivo obrigatório para bloquear
  await expect(page.getByTestId('confirm-commit')).toBeDisabled()
  await page.getByTestId('reason').fill('aguardando a API de frete')
  await expect(page.getByTestId('commit-diff')).toContainText(
    '| Samuel Fiais | status_change | in_progress | blocked | aguardando a API de frete (via Voyager)',
  )
  await expect(page.getByTestId('commit-diff')).toContainText(
    'commit: "AC-T003: in_progress → blocked (via Voyager)"',
  )
  await page.getByTestId('confirm-commit').click()

  await expect(page.getByTestId('toast')).toContainText(`Commit`)
  await expect(page.getByTestId('commit-sheet')).toHaveCount(0)
  expect(gh.commits.size).toBe(commits + 1)
  expect(gh.file(T3)).toContain('status: blocked')
  // a cópia local foi sincronizada e a página mostra o status novo
  await expect(page.getByTestId('status-button')).toContainText('Bloqueada')
  await expect(page.getByTestId('audit-list')).toContainText(
    'aguardando a API de frete (via Voyager)',
  )
})

test('concluir sem revisão aprovada mostra a regra e não grava', async ({ page }) => {
  const gh = await fakeGitHub(page)
  await signIn(page, gh)
  await openWorkspace(page)
  await page.goto(open(T2))
  const commits = gh.commits.size
  await page.getByTestId('status-button').click()
  await page.getByTestId('status-menu').locator('[data-status="done"]').click()
  await expect(page.getByTestId('commit-errors')).toContainText(
    'Só o fluxo de revisão promove uma task para Concluída',
  )
  await expect(page.getByTestId('confirm-commit')).toBeDisabled()
  await page.keyboard.press('Escape')
  expect(gh.commits.size).toBe(commits)
})

test('conflito: a branch mudou o mesmo arquivo; nada é sobrescrito e dá para refazer', async ({
  page,
}) => {
  const gh = await fakeGitHub(page)
  await signIn(page, gh)
  await openWorkspace(page)
  await page.goto(open(T3))
  await page.getByTestId('status-button').click()
  await page.getByTestId('status-menu').locator('[data-status="in_review"]').click()
  // um agente altera a mesma task antes da confirmação
  await gh.externalCommit(
    { [T3]: gh.file(T3)!.replace('Carrinho no portal', 'Carrinho com cupom') },
    'agente',
  )
  const head = gh.head().sha
  await page.getByTestId('confirm-commit').click()
  await expect(page.getByTestId('conflict')).toContainText(T3)
  expect(gh.head().sha).toBe(head)

  await page.getByTestId('resync').click()
  await expect(page.getByTestId('confirm-commit')).toBeEnabled()
  await page.getByTestId('confirm-commit').click()
  await expect(page.getByTestId('toast')).toBeVisible()
  expect(gh.file(T3)).toContain('Carrinho com cupom')
  expect(gh.file(T3)).toContain('status: in_review')
  expect(gh.head().parents).toEqual([head])
})
