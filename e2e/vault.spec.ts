import { expect, test } from '@playwright/test'
import { fakeGitHub, openWorkspace, signIn } from './support/github'

test('mostra contagens por type e status e lista links quebrados', async ({ page }) => {
  const gh = await fakeGitHub(page)
  await signIn(page, gh)
  await openWorkspace(page)
  const health = page.getByTestId('vault-health')
  await expect(health.getByTestId('type-task')).toContainText('6')
  await expect(health.getByTestId('type-task')).toContainText('blocked 1')
  await expect(page.getByTestId('broken-count')).toHaveText('0')

  await gh.externalCommit({
    'Demandas/Acme/AC-D003 - Com link quebrado.md':
      '---\ncode: "AC-D003"\ntype: demand\nstatus: discovered\n---\n\nVer [[Nota que sumiu]].\n',
  })
  await page.getByTestId('sync').click()
  await expect(page.getByTestId('broken-count')).toHaveText('1')
  await expect(page.getByTestId('broken-links')).toContainText('[[Nota que sumiu]]')
  await expect(health.getByTestId('type-demand')).toContainText('3')
})
