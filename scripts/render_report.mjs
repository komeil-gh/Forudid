import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'

const require = createRequire(new URL('../apps/web/package.json', import.meta.url))
const { chromium } = require('@playwright/test')
const [input, output, executablePath] = process.argv.slice(2)
const browser = await chromium.launch({ executablePath, headless: true })
process.once('SIGTERM', () => { void browser.close().finally(() => process.exit(143)) })
try {
  const context = await browser.newContext({ offline: true, javaScriptEnabled: false, serviceWorkers: 'block' })
  const page = await context.newPage()
  await page.setContent(await readFile(input, 'utf8'), { waitUntil: 'load', timeout: 30000 })
  await page.evaluate(() => {
    const format = (value, last = false) => {
      const year = /^\d{4}$/.test(value)
      const date = year ? new Date(Date.UTC(Number(value), last ? 11 : 0, last ? 31 : 1)) : new Date(value)
      if (Number.isNaN(date.getTime())) throw new Error('Invalid report date')
      return new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-arabext', {
        timeZone: 'UTC', year: 'numeric', ...(year ? {} : { month: 'long', day: 'numeric' }),
        ...(value.includes('T') ? { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' } : {}),
      }).format(date)
    }
    for (const element of document.querySelectorAll('time[data-report-end]')) {
      const first = format(element.dateTime), last = format(element.dataset.reportEnd, true)
      element.textContent = first === last ? first : `${first} – ${last}`
    }
  })
  await page.evaluate(() => document.fonts.ready)
  if (!await page.evaluate(() => document.fonts.check('12px Report'))) throw new Error('Report font unavailable')
  await page.pdf({ path: output, format: 'A4', preferCSSPageSize: true, printBackground: true, tagged: true })
  await writeFile(input, await page.content(), 'utf8')
  process.stdout.write(JSON.stringify({ browser: browser.version(), node: process.version, playwright: require('@playwright/test/package.json').version }))
} finally {
  await browser.close()
}
