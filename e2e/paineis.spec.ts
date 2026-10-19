import { expect, test } from '@playwright/test'
import { fakeGitHub, openWorkspace, signIn } from './support/github'

const P = 'Projetos/Acme/AC-P001 - Portal de pedidos/AC-P001 - Portal de pedidos.md'

test('os números do Painel batem com o vault', async ({ page }, info) => {
  const gh = await fakeGitHub(page)
  await signIn(page, gh)
  await openWorkspace(page)
  await page.goto('/?v=painel')
  const stats = page.getByTestId('stats')
  await expect(stats.locator('[data-stat="in_review"]')).toContainText('1')
  await expect(stats.locator('[data-stat="blocked"]')).toContainText('1')
  await expect(stats.locator('[data-stat="done"]')).toContainText('1')
  await expect(stats.locator('[data-stat="needs_clarification"]')).toContainText('AC-D002')
  await expect(page.getByTestId('types').locator('[data-bar="task"]')).toContainText('6')
  await expect(page.getByTestId('painel-project')).toContainText('1/6')
  await page.getByTestId('types').locator('[data-bar="task"]').hover()
  await expect(page.getByRole('tooltip')).toContainText('6 registros')
  await expect(page.getByTestId('activity').locator('[role=listitem]')).toHaveCount(8)
  await page.mouse.move(0, 0)
  await page.screenshot({ path: info.outputPath('painel.png'), fullPage: true })
})

test('criar uma view grava .voyager/views com commit e auditoria', async ({ page, isMobile }) => {
  const gh = await fakeGitHub(page)
  await signIn(page, gh)
  await openWorkspace(page)
  if (isMobile) await page.getByTestId('bottom-vault').click()
  await page.getByTestId('new-view').click()
  await page.getByTestId('view-title').fill('Tasks bloqueadas')
  await page.getByTestId('view-type').selectOption('task')
  await page.getByTestId('view-dialog').getByRole('button', { name: 'Bloqueada' }).click()
  await page.getByTestId('view-continue').click()
  await expect(page.getByTestId('commit-diff')).toContainText(
    '.voyager/views/tasks-bloqueadas.json',
  )
  const commits = gh.commits.size
  await page.getByTestId('confirm-commit').click()
  await expect(page.getByTestId('toast')).toBeVisible()
  expect(gh.commits.size).toBe(commits + 1)
  const json = JSON.parse(gh.file('.voyager/views/tasks-bloqueadas.json')!)
  expect(json.audit[0]).toMatch(
    /\| Samuel Fiais \| created \| — \| table \| view Tasks bloqueadas \(via Voyager\)$/,
  )
  if (isMobile) await page.getByTestId('bottom-vault').click()
  await page
    .getByTestId('sidebar-views')
    .getByRole('button', { name: /Tasks bloqueadas/ })
    .click()
  await expect(page.getByTestId('view-table')).toContainText('AC-T004')
  await expect(page.getByTestId('view-table')).not.toContainText('AC-T002')
})

test('blocos embutidos renderizam na nota e continuam legíveis como código', async ({
  page,
}, info) => {
  const gh = await fakeGitHub(page)
  await signIn(page, gh)
  await openWorkspace(page)
  await page.goto(`/?v=${encodeURIComponent(`n:${P}`)}`)
  await expect(page.getByTestId('block-query').getByTestId('view-table')).toContainText('AC-T004')
  await expect(page.getByTestId('block-query').getByTestId('view-table')).not.toContainText(
    'AC-T005',
  )
  await expect(page.getByTestId('block-chart').getByTestId('view-chart')).toContainText('Bloqueada')
  await expect(page.getByTestId('block-kanban').getByTestId('view-kanban')).toContainText('AC-T006')
  await page.getByTestId('block-chart').scrollIntoViewIfNeeded()
  await page.screenshot({ path: info.outputPath('blocos.png'), fullPage: true })
  // no arquivo, o bloco é texto simples (o Obsidian mostra como código)
  expect(gh.file(P)).toContain('```query\ntitle: Tasks em aberto\ntype: task')
})
