import { expect, test } from '@playwright/test'
import { fakeGitHub, openWorkspace, signIn } from './support/github'

const D1 = 'Demandas/Acme/AC-D001 - Portal de pedidos.md'
const open = (path: string) => `/?v=${encodeURIComponent(`n:${path}`)}`
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

test('editar a demanda gera um commit com as linhas certas e uma linha de auditoria', async ({
  page,
}) => {
  const gh = await fakeGitHub(page)
  await signIn(page, gh)
  await openWorkspace(page)
  await page.goto(open(D1))
  const commits = gh.commits.size
  await page.getByTestId('edit-note').click()
  const editor = page.getByTestId('editor-content')
  await expect(editor).toBeVisible()
  await editor.click()
  await page.keyboard.press('Control+End')
  await page.keyboard.type('\nNova linha escrita no Voyager.')
  await page.getByTestId('save-note').click()
  const diff = page.getByTestId('commit-diff')
  await expect(diff).toContainText(/\+[12] −0 linhas/)
  await expect(diff).toContainText('+ Nova linha escrita no Voyager.')
  await expect(diff).toContainText(
    '| Samuel Fiais | updated | ready | ready | edição do conteúdo (via Voyager)',
  )
  await page.getByTestId('confirm-commit').click()
  await expect(page.getByTestId('toast')).toBeVisible()
  expect(gh.commits.size).toBe(commits + 1)
  const text = gh.file(D1)!
  expect(text).toContain('Nova linha escrita no Voyager.\n\n## Auditoria')
  expect(text.match(/\(via Voyager\)/g)).toHaveLength(1)
  await expect(page.getByTestId('markdown')).toContainText('Nova linha escrita no Voyager.')
})

test('criar uma demanda nova gera o próximo código com o template e o vínculo de volta no mesmo commit', async ({
  page,
}) => {
  const gh = await fakeGitHub(page)
  await signIn(page, gh)
  await openWorkspace(page)
  const commits = gh.commits.size
  await page.getByTestId('new-note-button').click()
  await page.getByTestId('new-type').selectOption({ label: 'Demanda · demand · analisar-demanda' })
  await page.getByTestId('new-name').fill('Integração com o ERP')
  await page.getByTestId('new-client').getByRole('textbox').fill('acme')
  await page.getByTestId('new-client').getByRole('option').first().click()
  await expect(page.getByTestId('new-preview')).toContainText(
    'AC-D003 → Demandas/Acme/AC-D003 - Integração com o ERP.md',
  )
  await page.getByTestId('new-continue').click()
  await expect(page.getByTestId('commit-sheet')).toContainText('AC-D003: nova nota (demand)')
  await expect(page.getByTestId('commit-diff')).toContainText('Clientes/C001 - Acme.md')
  await page.getByTestId('confirm-commit').click()
  await expect(page.getByTestId('note-header')).toContainText('AC-D003')
  expect(gh.commits.size).toBe(commits + 1)
  const created = gh.file('Demandas/Acme/AC-D003 - Integração com o ERP.md')!
  expect(created).toContain('type: demand\nstatus: discovered')
  expect(created).toContain('## Pedido e problema')
  expect(gh.file('Clientes/C001 - Acme.md')).toContain(
    '[[Demandas/Acme/AC-D003 - Integração com o ERP|AC-D003 - Integração com o ERP]]',
  )
  await expect(page.getByTestId('backlinks')).toContainText('C001')
})

test('vincular duas notas grava o vínculo de volta e auditoria nas duas no mesmo commit', async ({
  page,
}) => {
  const gh = await fakeGitHub(page)
  await signIn(page, gh)
  await openWorkspace(page)
  await page.goto(open('Demandas/Acme/AC-D002 - Relatório de vendas.md'))
  const commits = gh.commits.size
  await page.getByTestId('link-note').click()
  await page.getByTestId('link-target').getByRole('textbox').fill('AC-P001')
  await page.getByTestId('link-target').getByRole('option').first().click()
  await page.getByTestId('link-continue').click()
  await expect(page.getByTestId('commit-sheet')).toContainText('AC-D002 ↔ AC-P001')
  await page.getByTestId('confirm-commit').click()
  await expect(page.getByTestId('toast')).toBeVisible()
  expect(gh.commits.size).toBe(commits + 1)
  expect(gh.file('Demandas/Acme/AC-D002 - Relatório de vendas.md')).toContain(
    'vínculo para AC-P001 (via Voyager)',
  )
  expect(
    gh.file('Projetos/Acme/AC-P001 - Portal de pedidos/AC-P001 - Portal de pedidos.md'),
  ).toContain('vínculo de volta de AC-D002 (via Voyager)')
  await expect(page.getByTestId('links')).toContainText('AC-P001')
})

test('anexar uma imagem grava o arquivo e o embed na nota', async ({ page }) => {
  const gh = await fakeGitHub(page)
  await signIn(page, gh)
  await openWorkspace(page)
  await page.goto(open(D1))
  await page.getByTestId('edit-note').click()
  await expect(page.getByTestId('editor-content')).toBeVisible()
  await page
    .getByTestId('attach-input')
    .setInputFiles({ name: 'fluxo.png', mimeType: 'image/png', buffer: PNG })
  await expect(page.getByTestId('attachments')).toContainText('Demandas/Acme/Anexos/fluxo.png')
  await page.getByTestId('save-note').click()
  await expect(page.getByTestId('commit-diff')).toContainText('anexo novo')
  await page.getByTestId('confirm-commit').click()
  await expect(page.getByTestId('toast')).toBeVisible()
  expect(gh.file(D1)).toContain('![[fluxo.png]]')
  const head = gh.trees.get(gh.head().tree)!
  expect(head.has('Demandas/Acme/Anexos/fluxo.png')).toBe(true)
  await expect(page.getByTestId('markdown').locator('img')).toHaveAttribute('src', /^blob:/)
})
