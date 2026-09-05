import { test, expect } from '@playwright/test'

// eslint-disable-next-line no-empty-pattern -- Playwright requires fixture destructuring.
test.beforeEach(async ({}) => test.skip(!process.env.FORUDID_EXPOSURE_TESTS, 'Requires published real railway analysis'))

test('real historical exposure preserves NoData and links profile samples to the map', async ({ page, isMobile }) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto('/map?asset=29cbefaf-1ef9-594a-9957-68060bf45846&panel=asset&lon=51.55&lat=35.3&z=9&infrastructure=railway')
  const exposure = page.getByRole('region', { name: 'مواجههٔ توصیفی' })
  await expect(exposure.getByTestId('exposure-coverage')).toHaveText('۵۶٫۹٪')
  await expect(exposure.getByTestId('exposure-mean')).toHaveText('۹۳٫۵ mm/year')
  await expect(exposure.getByRole('img', { name: /پروفایل فاصله/ })).toBeVisible()
  await exposure.getByText('مقادیر نمونه‌ها', { exact: true }).click()
  await expect(exposure.getByRole('cell', { name: 'ناموجود', exact: true }).first()).toBeVisible()
  await exposure.getByRole('button').first().click()
  await expect(page.getByTestId('profile-map-marker')).toBeAttached()
  await exposure.getByText('مقادیر نمونه‌ها', { exact: true }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: `/tmp/forudid-qa/exposure-${isMobile ? 'mobile' : 'desktop'}.png` })
  await page.reload()
  await expect(exposure.getByTestId('exposure-coverage')).toHaveText('۵۶٫۹٪')
  expect(errors).toEqual([])
})
