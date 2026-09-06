import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

test.skip(!process.env.FORUDID_REPORT_TESTS, 'Requires real analyses and the foreground report worker')

test('real Persian report survives request failure and downloads the immutable PDF', async ({ page }, info) => {
  await page.goto('/assets/29cbefaf-1ef9-594a-9957-68060bf45846?product=744b6536-b9a7-56c5-85b1-66a629a78b91&analysis=f30d71aa-bda6-5098-b050-eed1f9657f0f')
  await expect(page.getByTestId('exposure-coverage')).toBeVisible()
  const report = page.getByRole('region', { name: 'گزارش غربالگری فارسی' })
  const url = '**/api/v1/reports'
  await page.route(url, route => route.fulfill({ status: 503, body: '{}' }))
  await report.getByRole('button', { name: 'ساخت گزارش غربالگری فارسی', exact: true }).click()
  await expect(report.getByRole('button', { name: 'تلاش دوباره', exact: true })).toBeVisible()
  await expect(page.getByTestId('exposure-coverage')).toBeVisible()
  await page.unroute(url)
  const created = page.waitForResponse(response => response.url().endsWith('/api/v1/reports') && response.request().method() === 'POST')
  await report.getByRole('button', { name: 'ساخت گزارش غربالگری فارسی', exact: true }).click()
  const job = await (await created).json()
  const link = report.getByRole('link', { name: 'دانلود گزارش غربالگری فارسی (PDF)' })
  await expect(link).toBeVisible({ timeout: 30000 })
  const downloading = page.waitForEvent('download')
  await link.click()
  const download = await downloading
  const path = `/tmp/forudid-qa/browser-report-${info.project.name}.pdf`
  await download.saveAs(path)
  const stored = await (await page.request.get(`/api/v1/reports/${job.id}`)).json()
  expect(createHash('sha256').update(await readFile(path)).digest('hex')).toBe(stored.checksum_sha256)
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
