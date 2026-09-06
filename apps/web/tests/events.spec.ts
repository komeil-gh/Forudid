import { expect, test } from '@playwright/test'

test('real event catalog stays empty until observations are published', async ({ page }) => {
  test.skip(!process.env.FORUDID_EVENT_TESTS, 'Requires the empty real event catalog')
  await page.goto('/events')
  await expect(page.getByRole('heading', { name: 'رخدادهای تغییرشکل', exact: true })).toBeVisible()
  await expect(page.getByText('هنوز رخداد واقعی منتشرشده‌ای وجود ندارد.', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: `/tmp/forudid-qa/events-empty-${test.info().project.name}.png`, fullPage: true })
})

test('isolated event UI contract preserves uncertainty, lineage, pagination and partial errors', async ({ page }) => {
  // Browser-only response interception; no fixture event is inserted into the product database.
  const id = '10000000-0000-4000-8000-000000000001'
  const date = '2026-09-03T15:26:55Z'
  let evidenceFails = true
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('**/api/v1/events/**', async route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/evidence')) {
      if (evidenceFails) return route.fulfill({ status: 503, json: { error: 'isolated test failure' } })
      return route.fulfill({ json: { items: [{ id, evidence_type: 'nisar', source_version_id: id,
        observation_id: id, supersedes_id: null, supports_event: false, contradicts_event: true,
        independence_group: 'test-raw-acquisition', quality: {}, summary: 'شاهد متناقض آزمون رابط', created_at: date }], next_cursor: null } })
    }
    if (url.pathname.endsWith('/observations')) return route.fulfill({ json: { items: [{ id,
      product_id: id, source_version_id: id, interval_start: '2026-08-22T15:26:20Z', interval_end: date,
      available_at: '2026-09-05T12:00:00Z', sensor_family: 'nisar', component: 'los',
      measurement_method: 'test_only', maturity: 'provisional', raw_acquisition_ids: ['test-raw-acquisition'],
      velocity: null, displacement: null, acceleration: null, area: null, coverage: null,
      uncertainty: null, quality: {}, metrics: {} }], next_cursor: null } })
    if (url.pathname.endsWith('/timeline')) return route.fulfill({ json: { items: [{ id,
      revision_number: Number(url.searchParams.get('after')) > 0 ? 2 : 1, metrics: { status: 'candidate' },
      reason: 'تاریخچهٔ آزمون رابط', source_processing_run_id: id, provenance: { detector_version: 'test-only' },
      input_sha256: 'a'.repeat(64), created_at: date }], next_revision: Number(url.searchParams.get('after')) > 0 ? null : 1 } })
    return route.fulfill({ json: { event: { id, event_key: 'رخداد آزمون رابط', event_type: 'slope_change',
      status: 'candidate', revision_number: 2, first_detected_at: date, estimated_onset_at: null,
      last_observed_at: date, current_velocity: null, previous_velocity: null, acceleration_metric: null,
      area_current: 10000, area_max: 10000, growth_rate: null, dominant_component: 'los',
      confidence_grade: 'U', scientific_status: 'experimental', severity_screening_class: null,
      updated_at: date, velocity_unit: 'mm/year', area_unit: 'm2' },
    geometry: { type: 'MultiPolygon', coordinates: [[[[51, 35], [51.01, 35], [51.01, 35.01], [51, 35.01], [51, 35]]]] },
    disclaimer: 'فقط آزمون رابط؛ دادهٔ واقعی نیست.' } })
  })
  await page.goto(`/events/${id}`)
  await expect(page.getByRole('heading', { name: 'رخداد آزمون رابط', exact: true })).toBeVisible()
  await expect(page.getByText('شواهد ناکافی', { exact: true })).toBeVisible()
  await expect(page.getByText('موقت', { exact: true })).toBeVisible()
  await expect(page.getByText('test-raw-acquisition', { exact: true })).toBeVisible()
  await expect(page.locator('.event-map canvas')).toBeVisible()
  const evidence = page.getByRole('region', { name: 'شواهد' })
  await expect(evidence.getByRole('alert')).toBeVisible()
  evidenceFails = false
  await evidence.getByRole('button').click()
  await expect(evidence.getByText('شاهد متناقض آزمون رابط')).toBeVisible()
  await expect(evidence.getByText('متناقض', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'نسخه‌های بعدی' }).click()
  await expect(page.getByRole('heading', { name: 'نسخهٔ ۲', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(errors).toEqual([])
  await page.screenshot({ path: `/tmp/forudid-qa/events-contract-${test.info().project.name}.png`, fullPage: true })
  await page.getByRole('button', { name: 'EN', exact: true }).click()
  await expect(page.getByText('Insufficient evidence', { exact: true })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Evidence', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
