import { expect, test, type Page } from '@playwright/test'
import { fakeGitHub, openWorkspace, signIn } from './support/github'

const T3 =
  'Projetos/Acme/AC-P001 - Portal de pedidos/Tasks/AC-T003 - Carrinho/AC-T003 - Carrinho.md'

async function dragTo(page: Page, code: string, col: string, during?: () => Promise<void>) {
  const card = page.locator(`[data-testid=kanban-card][data-code="${code}"]`)
  const box = (await card.boundingBox())!
  await page.mouse.move(box.x + 20, box.y + 12)
  await page.mouse.down()
  await page.mouse.move(box.x + 40, box.y + 30, { steps: 4 })
  const target = page.locator(`[data-col="${col}"]`)
  await target.scrollIntoViewIfNeeded()
  const tb = (await target.boundingBox())!
  await page.mouse.move(tb.x + tb.width / 2, tb.y + 60, { steps: 8 })
  if (during) await during()
  await page.mouse.up()
}

test.describe('kanban', () => {
  test.beforeEach(async ({ page }) => {
    const gh = await fakeGitHub(page)
    await signIn(page, gh)
    await openWorkspace(page)
    await page.goto('/?v=kanban')
    await expect(page.getByTestId('kanban')).toBeVisible()
    ;(page as unknown as { gh: typeof gh }).gh = gh
  })

  test('arrastar acende as colunas válidas e gera o commit esperado', async ({
    page,
    isMobile,
  }, info) => {
    test.skip(!!isMobile, 'arrastar com mouse é testado no desktop; o celular usa o ⋯')
    const gh = (page as unknown as { gh: Awaited<ReturnType<typeof fakeGitHub>> }).gh
    const commits = gh.commits.size
    await dragTo(page, 'AC-T003', 'in_review', async () => {
      await expect(page.locator('[data-col="in_review"]')).toHaveAttribute('data-valid', 'valid')
      await expect(page.locator('[data-col="in_progress"]')).toHaveAttribute('data-valid', 'self')
      await page.screenshot({ path: info.outputPath('arrastando.png') })
    })
    await expect(page.getByTestId('commit-sheet')).toContainText('AC-T003: in_progress → in_review')
    await page.getByTestId('confirm-commit').click()
    await expect(page.getByTestId('toast')).toBeVisible()
    expect(gh.commits.size).toBe(commits + 1)
    expect(gh.file(T3)).toContain('status: in_review')
    await expect(page.locator('[data-col="in_review"]')).toContainText('AC-T003')
  })

  test('soltar na própria coluna ou fora não faz nada', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'arrastar com mouse é testado no desktop')
    await dragTo(page, 'AC-T003', 'in_progress')
    await expect(page.getByTestId('commit-sheet')).toHaveCount(0)
    const card = page.locator('[data-testid=kanban-card][data-code="AC-T003"]')
    const box = (await card.boundingBox())!
    await page.mouse.move(box.x + 20, box.y + 12)
    await page.mouse.down()
    await page.mouse.move(box.x + 20, box.y + 600, { steps: 10 })
    await page.mouse.up()
    await expect(page.getByTestId('commit-sheet')).toHaveCount(0)
  })

  test('soltar em Concluída sem revisão mostra a regra e não grava', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'arrastar com mouse é testado no desktop')
    const gh = (page as unknown as { gh: Awaited<ReturnType<typeof fakeGitHub>> }).gh
    const commits = gh.commits.size
    await dragTo(page, 'AC-T002', 'done')
    await expect(page.getByTestId('commit-errors')).toContainText('Só o fluxo de revisão')
    await expect(page.getByTestId('confirm-commit')).toBeDisabled()
    expect(gh.commits.size).toBe(commits)
  })

  test('funciona por teclado: Espaço pega, seta move, Espaço solta', async ({ page, isMobile }) => {
    test.skip(!!isMobile, 'teclado físico no desktop')
    const card = page.locator('[data-testid=kanban-card][data-code="AC-T003"]')
    await card.focus()
    await page.keyboard.press('Space')
    await expect(page.locator('[data-col="in_review"]')).toHaveAttribute('data-valid', 'valid')
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('[data-col="in_review"]')).toHaveAttribute('data-over', 'true')
    await page.keyboard.press('Space')
    await expect(page.getByTestId('commit-sheet')).toContainText('AC-T003: in_progress → in_review')
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('commit-sheet')).toHaveCount(0)
  })

  test('⋯ como alternativa ao arrastar, também por teclado', async ({ page }) => {
    const gh = (page as unknown as { gh: Awaited<ReturnType<typeof fakeGitHub>> }).gh
    const card = page.locator('[data-testid=kanban-card][data-code="AC-T006"]')
    await card.hover()
    await card.getByTestId('card-more').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByTestId('status-menu')).toBeVisible()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    const sheet = page.getByTestId('commit-sheet')
    await expect(sheet).toContainText('AC-T006: ready →')
    await page.getByTestId('confirm-commit').click()
    await expect(page.getByTestId('toast')).toBeVisible()
    expect(gh.commits.size).toBeGreaterThan(1)
  })
})
