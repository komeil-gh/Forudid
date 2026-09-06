import { expect, test } from '@playwright/test'

test('real source registry exposes versions without private storage locations', async ({ page }) => {
  test.skip(!process.env.FORUDID_REAL_SOURCE_TESTS, 'Requires the verified official Zenodo snapshot')
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/sources')
  await expect(page.getByRole('heading', { name: 'منابع داده', exact: true })).toBeVisible()
  if (test.info().project.name === 'mobile') {
    await page.locator('.mobile-navigation summary').click()
    await expect(page.getByRole('navigation', { name: 'ناوبری موبایل' })).toBeVisible()
    await page.getByRole('navigation', { name: 'ناوبری موبایل' }).getByRole('link', { name: 'منابع داده' }).click()
    await expect(page.locator('.mobile-navigation')).not.toHaveAttribute('open')
  }
  await expect(page.getByRole('heading', { name: /فرونشست ایران، مشاهدات/ })).toBeVisible()
  await expect(page.getByText('checksum فایل‌های اصلی بررسی شده است.', { exact: true })).toBeVisible()
  const historical = page.getByRole('article').filter({ has: page.getByRole('heading', { name: /فرونشست ایران، مشاهدات/ }) })
  await historical.getByText('فایل‌ها و شناسهٔ یکپارچگی', { exact: true }).click()
  await expect(historical.locator('.source-version li')).toHaveCount(3)
  await expect(historical.locator('.source-version code')).toHaveCount(4)
  expect(await page.locator('body').innerText()).not.toContain('s3://')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(errors).toEqual([])
  await page.screenshot({ path: `/tmp/forudid-sources-${test.info().project.name}.png`, fullPage: true })
})
