import { defineConfig, devices } from '@playwright/test';

/**
 * DemoBlaze (https://demoblaze.com/) Playwright configuration.
 * See demoblaze-knowledge-base.md for selectors, flows and API contract.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: 'https://demoblaze.com',
    // Carousel is hidden at <= 800px viewport (CSS media query), so use a desktop viewport by default.
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10_000,
    // Opcional: pausa entre acciones para demos (ej. PW_SLOW_MO=300).
    // La inyecta scripts/run.mjs con la opción --slow-mo.
    slowMo: process.env.PW_SLOW_MO ? Number(process.env.PW_SLOW_MO) : undefined,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Cross-browser coverage. Select with:
    //   npm run t -- --browser firefox          (runner -> --project=firefox)
    //   npx playwright test --project=firefox   (equivalent nativo)
    // Requires the binary: npx playwright install firefox
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // WebKit needs `npx playwright install webkit`; uncomment to enable it:
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },

    // Mobile view in Chrome (Pixel 7: 412x915, isMobile, hasTouch).
    // The desktop viewport above is overridden by the device descriptor.
    //   npm run t -- --browser mobile            (headless)
    //   npm run t -- --browser mobile --headed   (visible)
    //   npm run test:mobile
    // NOTE: the hero carousel is hidden by CSS at <= 800px and the Bootstrap
    // navbar collapses, so desktop-only assertions fail here by design.
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
