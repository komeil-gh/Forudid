import { test, expect } from '@playwright/test'

// eslint-disable-next-line no-empty-pattern -- Playwright requires fixture destructuring.
test.beforeEach(async ({}) => {
  test.skip(!process.env.FORUDID_OSM_TESTS, 'Requires the verified OSM snapshot and Martin')
})
test('real vector selection preserves source identity and reload', async ({ page, request, isMobile }) => {
  const listing = await request.get('/api/v1/assets?asset_type=railway&limit=1')
  const item = (await listing.json()).items[0]
  const detail = await (await request.get(`/api/v1/assets/${item.id}`)).json()
  const coords: number[][] = detail.geometry.coordinates
  const index = Math.floor((coords.length - 1) / 2)
  const lon = (coords[index][0] + coords[index + 1][0]) / 2
  const lat = (coords[index][1] + coords[index + 1][1]) / 2
  const failures: string[] = []
  page.on('pageerror', error => failures.push(error.message))
  const tile = page.waitForResponse(r => /\/vector\/railways\/\d+\//.test(r.url()) && r.status() === 200)
  await page.goto(`/map?lon=${lon}&lat=${lat}&z=14&infrastructure=railway`)
  await tile
  const canvas = page.locator('.maplibregl-canvas')
  const bounds = await canvas.boundingBox()
  expect(bounds).not.toBeNull()
  await canvas.click({ position: { x: bounds!.width / 2, y: bounds!.height / 2 } })
  const panel = page.getByRole('region', { name: 'زیرساخت انتخاب‌شده' })
  await expect(panel).toBeVisible()
  const selectedId = new URL(page.url()).searchParams.get('asset')
  expect(selectedId).toMatch(/^[0-9a-f-]{36}$/)
  const selected = await (await request.get(`/api/v1/assets/${selectedId}`)).json()
  await expect(panel).toContainText(selected.properties.external_id)
  await expect(panel).toContainText('ODbL 1.0')
  await expect(page).toHaveURL(new RegExp(`asset=${selectedId}`))
  const reloadedTile = page.waitForResponse(r => /\/vector\/railways\/\d+\//.test(r.url()) && r.status() === 200)
  await page.reload()
  await reloadedTile
  await expect(page.locator('.legend')).toBeVisible()
  await expect(panel).toContainText(selected.properties.external_id)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: `/tmp/forudid-qa/infrastructure-${isMobile ? 'mobile' : 'desktop'}.png` })
  expect(failures).toEqual([])
})
test('vector outage preserves the real deformation measurement', async ({ page }) => {
  await page.route('**/vector/**', route => route.fulfill({ status: 503, body: '{}' }))
  await page.goto('/map?lon=55.65368745&lat=30.86962006&pointLon=55.65368745&pointLat=30.86962006&panel=point&z=10')
  await expect(page.getByText(/^(?:370\.0|۳۷۰٫۰)$/)).toBeVisible()
  await expect(page.getByText('لایهٔ زیرساخت در دسترس نیست؛ دادهٔ تغییرشکل مستقل نمایش داده می‌شود.')).toBeVisible()
  await expect(page.locator('.maplibregl-canvas')).toBeVisible()
})
