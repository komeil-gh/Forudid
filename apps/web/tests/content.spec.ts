import { expect, test } from '@playwright/test'

test('content routes load on demand and retain language and responsive layout', async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await expect(page).toHaveTitle('فرودید | FORUDID')
  await expect(page.getByRole('link', { name: 'ورود به نقشهٔ ایران', exact: true })).toBeVisible()
  await page.goto('/methodology')
  await expect(page.getByRole('heading', { name: 'تفسیر و انتشار.', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'EN', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Interferometric observation.', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Interferometric observation.', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: `/tmp/forudid-qa/methodology-release-${info.project.name}.png` })
  await page.goto('/about')
  await expect(page.getByRole('contentinfo')).toContainText('Forudid is an independent personal project')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: `/tmp/forudid-qa/about-release-${info.project.name}.png` })
  await expect(page.locator('vite-error-overlay')).toHaveCount(0)
  expect(errors).toEqual([])
})
