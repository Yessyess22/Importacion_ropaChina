import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E — S1-T09 / GAP-7
 * El stack completo (nginx + backend + frontend) debe estar corriendo
 * via docker-compose antes de ejecutar: npx playwright test
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,

  use: {
    baseURL: 'http://localhost',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
