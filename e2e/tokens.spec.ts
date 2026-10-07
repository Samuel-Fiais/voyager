import { expect, test } from '@playwright/test'

const TOKENS = {
  dark: { bg: 'rgb(11, 11, 12)', strong: 'rgb(242, 241, 236)', nasa: 'rgb(252, 61, 33)' },
  light: { bg: 'rgb(255, 255, 255)', strong: 'rgb(11, 11, 12)', nasa: 'rgb(224, 48, 27)' },
} as const

for (const scheme of ['dark', 'light'] as const) {
  test(`abre a página de tokens no tema ${scheme === 'dark' ? 'escuro' : 'claro'}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: scheme })
    await page.goto('/design')
    await expect(page.getByRole('heading', { name: 'Tokens de design' })).toBeVisible()

    const body = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(body).toBe(TOKENS[scheme].bg)
    const nasa = await page
      .getByTestId('swatch-nasa')
      .locator('div')
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(nasa).toBe(TOKENS[scheme].nasa)

    // Nada estoura a largura da página.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
}

test('o botão de tema troca e guarda a escolha', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/design')
  await page.getByTestId('theme-toggle').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
    TOKENS.light.bg,
  )
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})
