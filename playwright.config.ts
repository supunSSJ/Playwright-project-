import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  // Each test 30s timeout
  timeout: 30 * 1000,

  use: {
    headless: false,
  },

  // 👇 BROWSERS DEFINE කරන්නේ මෙතන
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
