import { defineConfig, devices } from '@playwright/test'
export default defineConfig({ testDir: './tests', fullyParallel: false, workers: 1,
  timeout: 40_000, expect: { timeout: 12_000 }, reporter: 'list',
  webServer: process.env.FORUDID_START_SERVERS ? [
    { command: 'uv run --project apps/api uvicorn forudid_api.main:app --host 127.0.0.1 --port 58000',
      cwd: '../..', url: 'http://127.0.0.1:58000/health/ready', timeout: 60_000 },
    { command: 'pnpm dev', cwd: '../..', url: 'http://127.0.0.1:5173', timeout: 60_000 },
  ] : undefined,
  use: { baseURL: process.env.WEB_BASE_URL || 'http://127.0.0.1:5173', trace: 'retain-on-failure',
    channel: process.env.PLAYWRIGHT_CHANNEL },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1008 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
})
