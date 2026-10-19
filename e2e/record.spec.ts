import { expect, test } from '@playwright/test'
import { fakeGitHub, openWorkspace, signIn } from './support/github'

const P = 'Projetos/Acme/AC-P001 - Portal de pedidos'

test('páginas de registro: demanda, projeto, task, cliente e anexo', async ({ page }, info) => {
  const gh = await fakeGitHub(page)
  await signIn(page, gh)
  await openWorkspace(page)

  // Demanda: tabela, checklist, Mermaid e auditoria em trajetória
  await page.goto(`/?v=${encodeURIComponent('n:Demandas/Acme/AC-D001 - Portal de pedidos.md')}`)
  const record = page.getByTestId('record')
  await expect(page.getByTestId('note-header')).toContainText('AC-D001')
  await expect(record.locator('table')).toBeVisible()
  await expect(page.getByTestId('mermaid').locator('svg')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByTestId('properties')).toContainText('implementation_plan')
  const dots = page.getByTestId('audit-dot')
  await expect(dots).toHaveCount(3)
  await dots.nth(1).hover()
  const tip = page.getByTestId('trajectory-tip')
  await expect(tip).toContainText('/09/2026')
  await expect(tip).toContainText('agent:claude')
  await expect(tip).toContainText('Descoberta')
  await expect(tip).toContainText('Precisa de esclarecimento')
  await expect(tip).toContainText('depois do anterior')
  await page.screenshot({ path: info.outputPath('demanda.png'), fullPage: true })

  // Status: menu só com transições do contrato
  await page.getByTestId('status-button').click()
  await expect(page.getByTestId('status-menu')).toContainText('Recusada')
  await page.keyboard.press('Escape')

  // Wikilink abre a nota certa
  await record.getByRole('button', { name: 'ficha da Acme' }).click()
  await expect(page.getByTestId('note-header')).toContainText('C001')
  await expect(record).toContainText('Documentos relacionados')
  await expect(record).toContainText('AC-D001')

  // Projeto: trajetória com um ponto por task; dica e clique abrem a task
  await page.goto(`/?v=${encodeURIComponent(`n:${P}/AC-P001 - Portal de pedidos.md`)}`)
  const pdots = page.getByTestId('project-dot')
  await expect(pdots).toHaveCount(6)
  await pdots.nth(3).hover()
  await expect(page.getByTestId('trajectory-tip')).toContainText('AC-T004')
  await expect(page.getByTestId('trajectory-tip')).toContainText('Bloqueada')
  await expect(page.getByTestId('project-group-blocked')).toContainText('Pagamento')
  await page.screenshot({ path: info.outputPath('projeto.png'), fullPage: true })
  await pdots.nth(3).click()
  await expect(page.getByTestId('note-header')).toContainText('AC-T004')
  await expect(page.getByTestId('status-button')).toHaveClass(/text-nasa/)
  await expect(page.getByTestId('backlinks')).toContainText('AC-P001')

  // Revisão com imagem embutida vinda da cópia local
  await page.goto(
    `/?v=${encodeURIComponent(`n:${P}/Tasks/AC-T001 - Login de clientes/Revisões/AC-T001-REV001 - Login de clientes.md`)}`,
  )
  const img = page.getByTestId('markdown').locator('img')
  await expect(img).toHaveAttribute('src', /^blob:/)

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})
