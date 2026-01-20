import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Setup project: runs auth capture in Playwright (may be blocked by Google)
    // Run explicitly with: npx playwright test --project=setup --headed
    // Prefer: make e2e-chrome + make e2e-capture instead
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Main test project: auth is injected via fixtures.ts (IndexedDB)
    // Run with: npx playwright test --project=chromium
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Note: Auth is injected via fixtures.ts addInitScript, not storageState
        // This is because Firebase stores auth in IndexedDB, not cookies/localStorage
      },
      testIgnore: [/.*\.setup\.ts/, /capture-from-chrome\.ts/],
    },
  ],

  // Run local dev server before tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
