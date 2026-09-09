import { test, expect } from '@playwright/test'

const current = 'b626dc10-f9f7-5b67-9f49-889e391c8b15'
const historical = '488059d8-d3f6-5064-af66-131da47742e3'

test('real population raster, source year, native sample and local place search agree', async ({ page, request, isMobile }) => {
  test.skip(!process.env.FORUDID_POPULATION_2026_TESTS, 'Requires the verified 2026 source and published analysis')
  const errors: string[] = [], tiles: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('response', response => { if (response.url().includes('/tiles/population/') && response.status() === 200) tiles.push(response.url()) })
  await page.goto('/map?mode=population&infrastructure=none')
  await expect(page.locator('.population-legend')).toContainText('2026')
  await expect.poll(() => tiles.some(url => url.includes(current))).toBe(true)
  await expect(page.locator('.map-country-label').filter({ hasText: 'ایران' })).toBeVisible()
  const search = page.getByRole('textbox', { name: 'جست‌وجوی شهر یا مختصات' })
  await search.fill('تهران')
  await page.locator('.place-results button').filter({ has: page.getByText('تهران', { exact: true }) }).first().click()
  await expect(page).toHaveURL(/z=10/)
  await expect(page.locator('.map-place-label').filter({ hasText: 'تهران' })).toBeVisible()
  await search.fill('۵۱٫۴، ۳۵٫۷')
  await search.press('Enter')
  await expect(page).toHaveURL(/lon=51.4/)
  await page.getByRole('button', { name: 'بررسی نقطهٔ مرکز نقشه' }).click()
  const sample = await request.get(`/api/v1/population/sources/${current}/point?lon=51.4&lat=35.7`)
  expect(sample.ok()).toBe(true)
  const count = (await sample.json()).count as number
  await expect(page.getByTestId('population-cell-count')).toContainText(count.toLocaleString('fa-IR', { maximumFractionDigits: 1 }))
  await page.screenshot({ path: `/tmp/forudid-qa/population-2026-${isMobile ? 'mobile' : 'desktop'}.png` })
  await page.getByRole('region', { name: 'سلول جمعیت انتخاب‌شده' }).getByRole('button', { name: 'بستن' }).click()
  if (isMobile) await page.locator('.mobile-layer-button').click()
  await expect(page.getByTestId('population-total').filter({ visible: true })).toHaveText('۹۲٬۸۱۴٬۶۶۴')
  await page.getByRole('combobox', { name: 'سال و نسخهٔ جمعیت' }).selectOption(historical)
  await expect(page.getByTestId('population-total').filter({ visible: true })).toHaveText('۸۰٬۳۸۲٬۵۲۱')
  if (isMobile) await page.locator('.sheet-close').click()
  await expect(page.locator('.population-legend')).toContainText('2020')
  await expect.poll(() => tiles.some(url => url.includes(historical))).toBe(true)
  await page.reload()
  await expect(page).toHaveURL(new RegExp(`populationVersion=${historical}`))
  await expect(page.locator('.population-legend')).toContainText('2020')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(errors).toEqual([])
})


test('a failed population tile can be retried without losing map context or native sampling', async ({ page }) => {
  test.skip(!process.env.FORUDID_POPULATION_2026_TESTS, 'Requires the verified real population source')
  await page.route('**/tiles/population/**', route => route.fulfill({ status: 503, body: '' }))
  await page.goto('/map?mode=population&infrastructure=none')
  await expect(page.locator('.map-warning')).toBeVisible()
  await expect(page.locator('.map-country-label').filter({ hasText: 'ایران' })).toBeVisible()
  const search = page.getByRole('textbox', { name: 'جست‌وجوی شهر یا مختصات' })
  await search.fill('۵۱٫۴، ۳۵٫۷')
  await search.press('Enter')
  await page.getByRole('button', { name: 'بررسی نقطهٔ مرکز نقشه' }).click()
  await expect(page.getByTestId('population-cell-count')).toBeVisible()
  await page.unroute('**/tiles/population/**')
  const recovered = page.waitForResponse(response => response.url().includes(`/tiles/population/${current}/`) && response.ok())
  await page.locator('.map-warning').getByRole('button', { name: 'تلاش دوباره' }).click()
  await recovered
  await expect(page.locator('.map-warning')).toHaveCount(0)
  await expect(page).toHaveURL(/lon=51.4/)
  await expect(page.getByTestId('population-cell-count')).toBeVisible()
})

test('real population sampling remains available when the deformation catalog fails', async ({ page }) => {
  test.skip(!process.env.FORUDID_POPULATION_2026_TESTS, 'Requires the verified real population source')
  await page.route('**/api/v1/products?*', route => route.fulfill({ status: 503, body: '{}' }))
  await page.goto('/map?mode=population&infrastructure=none&lon=51.4&lat=35.7&z=10')
  await expect(page.locator('.population-legend')).toContainText('2026')
  await page.getByRole('button', { name: 'بررسی نقطهٔ مرکز نقشه' }).click()
  await expect(page.getByTestId('population-cell-count')).toBeVisible()
  await expect(page.locator('.map-message')).toHaveCount(0)
  await expect(page).not.toHaveURL(/run=/)
})
