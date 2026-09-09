import { test, expect } from '@playwright/test'

// eslint-disable-next-line no-empty-pattern -- Playwright requires fixture destructuring.
test.beforeEach(async ({}) => test.skip(!process.env.FORUDID_POPULATION_TESTS, 'Requires published real population analyses'))

test('real country and historical-region population results preserve selection and provenance', async ({ page, request, isMobile }) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto('/regions?populationVersion=488059d8-d3f6-5064-af66-131da47742e3')
  await expect(page.getByTestId('population-total')).toHaveText('۸۰٬۳۸۲٬۵۲۱')
  await page.getByRole('combobox', { name: 'محدوده', exact: true }).selectOption({ label: 'تهران' })
  await expect(page).toHaveURL(/region=/)
  await expect(page.getByTestId('population-total')).toBeVisible()
  const total = await page.getByTestId('population-total').textContent()
  expect(total).not.toBe('۸۰٬۳۸۲٬۵۲۱')
  await expect(page.getByRole('heading', { name: 'آمار مساحت‌وزن‌دار تغییرشکل' })).toBeVisible()
  await page.reload()
  await expect(page.getByTestId('population-total')).toHaveText(total!)
  if (process.env.FORUDID_REGION_INFRA_REAL_TESTS) {
    const region = new URL(page.url()).searchParams.get('region')!
    for (const type of ['railway', 'road']) {
      const response = await request.get(`/api/v1/products/744b6536-b9a7-56c5-85b1-66a629a78b91/infrastructure-exposure?asset_type=${type}&region_id=${region}`)
      expect(response.ok()).toBe(true)
      const metrics = (await response.json()).metrics
      expect(metrics.valid_length_m).toBeGreaterThan(0)
      await expect(page.getByTestId(`regional-${type}-valid`)).toHaveText((metrics.valid_length_m/1000).toLocaleString('fa-IR', { maximumFractionDigits: 1 }))
    }
  }
  await page.getByText('روش، منابع و شناسهٔ محاسبه', { exact: true }).click()
  await expect(page.getByText('روش آزمایشی؛ اعتبارسنجی علمی مستقل انجام نشده است.', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: `/tmp/forudid-qa/regions-${isMobile ? 'mobile' : 'desktop'}.png`, fullPage: true })
  await page.getByRole('button', { name: 'EN', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Population and regions', exact: true })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Region', exact: true })).toContainText('Tehran')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  if (process.env.FORUDID_REGION_INFRA_REAL_TESTS) {
    await page.route(/\/infrastructure-exposure\?.*asset_type=road/, route => route.fulfill({ status: 503, body: '{}' }))
    await page.reload()
    await expect(page.getByTestId('population-total')).toBeVisible()
    await expect(page.getByTestId('regional-railway-valid')).toBeVisible()
    await expect(page.getByRole('region', { name: 'Major-road exposure' }).getByRole('button')).toBeVisible()
    await expect(page.getByTestId('regional-road-valid')).toHaveCount(0)
  }
  expect(errors).toEqual([])
})
