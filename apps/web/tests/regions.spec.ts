import { test, expect } from '@playwright/test'

// eslint-disable-next-line no-empty-pattern -- Playwright requires fixture destructuring.
test.beforeEach(async ({}) => test.skip(!process.env.FORUDID_POPULATION_TESTS, 'Requires published real population analyses'))

test('real country and historical-region population results preserve selection and provenance', async ({ page, isMobile }) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto('/regions')
  await expect(page.getByTestId('population-total')).toHaveText('۸۰٬۳۸۲٬۵۲۱')
  await page.getByRole('combobox', { name: 'محدوده', exact: true }).selectOption({ label: 'تهران' })
  await expect(page).toHaveURL(/region=/)
  await expect(page.getByTestId('population-total')).toBeVisible()
  const total = await page.getByTestId('population-total').textContent()
  expect(total).not.toBe('۸۰٬۳۸۲٬۵۲۱')
  await expect(page.getByRole('heading', { name: 'آمار مساحت‌وزن‌دار تغییرشکل' })).toBeVisible()
  await page.reload()
  await expect(page.getByTestId('population-total')).toHaveText(total!)
  await page.getByText('روش، منابع و شناسهٔ محاسبه', { exact: true }).click()
  await expect(page.getByText('روش آزمایشی؛ اعتبارسنجی علمی مستقل انجام نشده است.', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: `/tmp/forudid-qa/regions-${isMobile ? 'mobile' : 'desktop'}.png`, fullPage: true })
  await page.getByRole('button', { name: 'EN', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Population and regions', exact: true })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Region', exact: true })).toContainText('Tehran')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(errors).toEqual([])
})
