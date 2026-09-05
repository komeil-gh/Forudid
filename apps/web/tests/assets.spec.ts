import { test, expect } from '@playwright/test'

// eslint-disable-next-line no-empty-pattern -- Playwright requires fixture destructuring.
test.beforeEach(async ({}) => test.skip(!process.env.FORUDID_RANKING_TESTS, 'Requires published real railway rankings'))

test('real ranking opens a pinned asset profile and downloads real CSV', async ({ page, isMobile }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/assets?q=963780743')
  await expect(page.getByRole('heading', { name: 'زیرساخت و مواجههٔ تاریخی' })).toBeVisible()
  const table = page.getByRole('region', { name: 'جدول زیرساخت' })
  await expect(table.getByRole('link')).toHaveCount(1)
  await expect(table.getByRole('cell', { name: '۵۶٫۹٪', exact: true })).toBeVisible()
  const pageDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'CSV همین صفحه', exact: true }).click()
  expect((await pageDownload).suggestedFilename()).toBe('forudid-assets-current-page.csv')
  await table.getByRole('link').click()
  await expect(page).toHaveURL(/assets\/29cbefaf-1ef9-594a-9957-68060bf45846.*analysis=/)
  await expect(page.getByTestId('exposure-mean')).toHaveText('۹۳٫۵ mm/year')
  await expect(page.getByRole('img', { name: /پروفایل فاصله/ })).toBeVisible()
  await page.getByText('مقادیر نمونه‌ها', { exact: true }).click()
  await page.locator('.series-table').getByRole('button').first().click()
  await expect(page.getByTestId('profile-map-marker')).toBeAttached()
  await page.getByText('مقادیر نمونه‌ها', { exact: true }).click()
  const profileDownload = page.waitForEvent('download')
  await page.getByRole('link', { name: 'پروفایل کامل (CSV)', exact: true }).click()
  expect((await profileDownload).suggestedFilename()).toContain('-profile.csv')
  await page.reload()
  await expect(page.getByTestId('exposure-mean')).toHaveText('۹۳٫۵ mm/year')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: `/tmp/forudid-qa/asset-detail-${isMobile ? 'mobile' : 'desktop'}.png`, fullPage: true })
  expect(errors).toEqual([])
})
