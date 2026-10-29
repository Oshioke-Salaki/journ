import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3197);
/** Set E2E_BASE_URL to test a deployed site (with E2E_REMOTE=1 for the hosted database). */
const remoteURL = process.env.E2E_BASE_URL;
const baseURL = remoteURL ?? `http://localhost:${PORT}`;

/**
 * End-to-end tests run against a production build and the local Supabase stack
 * (`pnpm db:start`, then `pnpm build`). Each test signs up its own member, so tests are independent.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [["list"], ["html", { open: "never", outputFolder: "tests/report" }]],
  outputDir: "tests/results",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    channel: "chrome",
  },
  projects: [
    { name: "laptop", use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1440, height: 900 } } },
    { name: "iphone", use: { ...devices["iPhone 15"], browserName: "chromium", channel: "chrome" } },
    { name: "ipad", use: { ...devices["iPad (gen 7)"], browserName: "chromium", channel: "chrome" } },
  ],
  webServer: remoteURL
    ? undefined
    : {
        command: `pnpm start -p ${PORT}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
