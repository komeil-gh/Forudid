import { readFile } from 'node:fs/promises'
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
  await page.evaluate(() => document.fonts.ready)
  if (!await page.evaluate(() => document.fonts.check('12px Report'))) throw new Error('Report font unavailable')
  await page.pdf({ path: output, format: 'A4', preferCSSPageSize: true, printBackground: true, tagged: true })
  process.stdout.write(JSON.stringify({ browser: browser.version(), node: process.version, playwright: require('@playwright/test/package.json').version }))
} finally {
  await browser.close()
}
