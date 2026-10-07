import { expect, test } from '@playwright/test'
import { fakeGitHub, openWorkspace, signIn } from './support/github'

test('navega por sidebar, abas e busca sem estourar a largura', async ({ page }, info) => {
  const gh = await fakeGitHub(page)
  await signIn(page, gh)
  await openWorkspace(page)
  const mobile = (page.viewportSize()?.width ?? 1280) < 780

  await expect(page.getByTestId('stats')).toBeVisible()
  await page.screenshot({ path: info.outputPath('painel.png'), fullPage: false })

  const sidebar = page.getByTestId('sidebar')
  const openSidebar = async () => {
    if (mobile) await page.getByTestId('menu-button').click()
  }

  // Projeto pela sidebar
  await openSidebar()
  await sidebar.getByTestId('sidebar-project').first().click()
  await expect(page.getByTestId('note-header')).toContainText('AC-P001')

  // Busca por título sem acento e por código
  await page.getByTestId('search-button').click()
  await page.getByTestId('palette-input').fill('catalogo')
  await expect(page.getByTestId('palette-list')).toContainText('AC-T002')
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('note-header')).toContainText('Catálogo de produtos')

  await page.keyboard.press('Control+k')
  await page.getByTestId('palette-input').fill('ac-d001')
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('note-header')).toContainText('AC-D001')

  // Abas: três notas + painel; fechar a atual cai na vizinha
  const tabs = page.getByTestId('tabs').getByRole('tab')
  await expect(tabs).toHaveCount(4)
  await page.getByRole('button', { name: 'Fechar aba Portal de pedidos' }).last().click()
  await expect(tabs).toHaveCount(3)

  // Views
  await openSidebar()
  await sidebar.getByRole('button', { name: /Kanban de tasks/ }).click()
  await expect(page.getByTestId('kanban').locator('[data-col="blocked"]')).toContainText('AC-T004')
  await page.screenshot({ path: info.outputPath('kanban.png') })
  await openSidebar()
  await sidebar.getByRole('button', { name: /Demandas/ }).click()
  await expect(page.getByTestId('demand-table')).toContainText('Relatório de vendas')
  await openSidebar()
  await sidebar.getByRole('button', { name: /Arquivos do vault/ }).click()
  await expect(page.getByTestId('files')).toContainText('Projetos')
  await page.screenshot({ path: info.outputPath('arquivos.png') })

  // Fechar todas as abas mostra o estado vazio
  while ((await tabs.count()) > 0) {
    await page
      .getByTestId('tabs')
      .getByRole('button', { name: /^Fechar aba/ })
      .first()
      .click()
  }
  await expect(page.getByTestId('blank')).toBeVisible()

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})
