import { expect, test, type Page } from '@playwright/test'
import { fakeGitHub, openWorkspace, signIn } from './support/github'

const T3 =
  'Projetos/Acme/AC-P001 - Portal de pedidos/Tasks/AC-T003 - Carrinho/AC-T003 - Carrinho.md'

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
}

async function swipe(page: Page, dx: number) {
  await page.getByTestId('view').evaluate((el, d) => {
    const opts = (x: number) => ({
      bubbles: true,
      pointerType: 'touch',
      clientX: x,
      clientY: 300,
      pointerId: 1,
    })
    el.dispatchEvent(new PointerEvent('pointerdown', opts(200)))
    el.dispatchEvent(new PointerEvent('pointerup', opts(200 + d)))
  }, dx)
}

test('no celular: sincronizar, abrir nota, mudar status de task e voltar, sem rolagem horizontal', async ({
  page,
  isMobile,
}, info) => {
  test.skip(!isMobile, 'fluxo do celular (390px)')
  const gh = await fakeGitHub(page)
  await signIn(page, gh)
  await openWorkspace(page)
  await expect(page.getByTestId('bottom-nav')).toBeVisible()
  await expect(page.getByTestId('tabs')).toHaveCount(0)
  await noHorizontalScroll(page)
  await page.screenshot({ path: info.outputPath('celular-painel.png') })

  // sincronizar
  await gh.externalCommit({ 'Demandas/Acme/AC-D003 - Nova.md': 'nova\n' })
  await page.getByTestId('sync').click()
  await expect(page.getByTestId('sync')).toBeEnabled()

  // abrir uma nota pela busca
  await page.getByTestId('bottom-buscar').click()
  await page.getByTestId('palette-input').fill('ac-d001')
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('note-header')).toContainText('AC-D001')
  await noHorizontalScroll(page)
  await page.screenshot({ path: info.outputPath('celular-nota.png') })

  // mudar o status de uma task pelo ⋯ do kanban (rolagem horizontal só no quadro)
  await page.getByTestId('bottom-kanban').click()
  await noHorizontalScroll(page)
  const card = page.locator('[data-testid=kanban-card][data-code="AC-T003"]')
  await card.scrollIntoViewIfNeeded()
  await card.getByTestId('card-more').click()
  await page.getByTestId('status-menu').locator('[data-status="in_review"]').click()
  await page.getByTestId('confirm-commit').click()
  await expect(page.getByTestId('toast')).toBeVisible()
  expect(gh.file(T3)).toContain('status: in_review')
  await page.screenshot({ path: info.outputPath('celular-kanban.png') })

  // voltar
  await page.getByTestId('back').click()
  await expect(page.getByTestId('note-header')).toContainText('AC-D001')
  await noHorizontalScroll(page)

  // o Vault abre a navegação por entidade
  await page.getByTestId('bottom-vault').click()
  await expect(page.getByTestId('sidebar')).toBeInViewport()
})

test('no celular: deslizar troca para o item vizinho', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'gesto do celular')
  const gh = await fakeGitHub(page)
  await signIn(page, gh)
  await openWorkspace(page)
  await page.getByTestId('bottom-buscar').click()
  await page.getByTestId('palette-input').fill('ac-d001')
  await page.keyboard.press('Enter')
  await page.getByTestId('bottom-buscar').click()
  await page.getByTestId('palette-input').fill('ac-d002')
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('mobile-bar')).toContainText('AC-D002 · 3/3')
  await swipe(page, 120)
  await expect(page.getByTestId('mobile-bar')).toContainText('AC-D001 · 2/3')
  await swipe(page, -120)
  await expect(page.getByTestId('mobile-bar')).toContainText('AC-D002 · 3/3')
  // gesto curto não troca
  await swipe(page, 30)
  await expect(page.getByTestId('mobile-bar')).toContainText('AC-D002 · 3/3')
})
