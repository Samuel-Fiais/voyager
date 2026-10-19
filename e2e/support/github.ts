import { expect, type Page } from '@playwright/test'
import { FakeGitHub } from '../../testing/fake-github'
import { loadFixtureVault } from '../../testing/fixture-vault'

/** Liga o GitHub simulado (vault sintético) às requisições da página. */
export async function fakeGitHub(page: Page, opts: { branches?: string[] } = {}) {
  const gh = await FakeGitHub.create(loadFixtureVault(), opts)
  await page.route('https://api.github.com/**', async (route) => {
    const req = route.request()
    const res = await gh.handle(req.method(), req.url(), req.postData() ?? undefined, req.headers())
    await route.fulfill({
      status: res.status,
      headers: { 'access-control-allow-origin': '*', ...res.headers },
      body: res.bytes ? Buffer.from(res.bytes) : res.status === 204 ? '' : JSON.stringify(res.body),
      contentType: res.bytes ? undefined : 'application/json',
    })
  })
  await page.route('**/api/auth/revoke', async (route) => {
    gh.revoked = true
    await route.fulfill({ status: 204 })
  })
  return gh
}

/** Entra direto com uma sessão já gravada (o fluxo OAuth tem teste próprio). */
export async function signIn(page: Page, gh: FakeGitHub) {
  await page.addInitScript((token) => {
    if (!localStorage.getItem('voyager.session') && !sessionStorage.getItem('voyager.e2e.out')) {
      localStorage.setItem(
        'voyager.session',
        JSON.stringify({ token, login: 'samuel-teste', name: 'Samuel Fiais', avatarUrl: '' }),
      )
    }
  }, gh.token)
}

/** Abre o vault sintético como workspace e espera a primeira sincronização. */
export async function openWorkspace(page: Page, branch = 'main', opts = { navigate: true }) {
  if (opts.navigate) await page.goto('/')
  await page.getByText('samuel-teste/vault-sintetico').click()
  await page.getByTestId('branch-list').getByText(branch, { exact: true }).click()
  await page.getByTestId('workspace-switcher').filter({ hasText: branch }).waitFor()
  await expect(page.getByTestId('sync')).toBeEnabled()
}

export async function idbCounts(page: Page) {
  return page.evaluate(
    () =>
      new Promise<{ workspaces: number; files: number }>((resolve) => {
        const req = indexedDB.open('voyager')
        req.onsuccess = () => {
          const db = req.result
          if (!db.objectStoreNames.contains('files')) return resolve({ workspaces: 0, files: 0 })
          const tx = db.transaction(['workspaces', 'files'])
          const w = tx.objectStore('workspaces').count()
          const f = tx.objectStore('files').count()
          tx.oncomplete = () => resolve({ workspaces: w.result, files: f.result })
        }
      }),
  )
}
