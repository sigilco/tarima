/**
 * Playwright configuration for the browser-level e2e suite.
 *
 * The suite drives the real board ui in a real browser against the
 * production-shaped server: the api process with the built web bundle
 * behind it, so the ui, the api and the ssr shell are all the same
 * origin, exactly as they are in production.
 *
 * The vite dev server is not used on purpose: the TanStack Start dev
 * plugin does not serve the ssr shell in this setup, so the browser
 * suite would test a half-working app.
 *
 * The api runs with the loopback mail domain and the deterministic stub
 * LLM, so the suite never sends a real email and never calls a model.
 *
 * Running the browser suite needs the Playwright browsers and a built
 * artifact:
 *
 *   pnpm build                              # the web bundle and the api
 *   pnpm --filter @tarima/e2e exec playwright install chromium
 *
 * The api-level suite in `src/api` proves the same loop without a
 * browser and is the gate that runs on every push.
 */
import { defineConfig, devices } from "@playwright/test";

/** The port the api (and the ui behind it) listens on. */
const APP_PORT = 3101;

/** The shared secret the inbound email webhook expects. */
const WEBHOOK_SECRET = "e2e-inbound-secret";

export default defineConfig({
  testDir: "./ui",
  // The chase loop is asynchronous; the browser suite waits on the ui.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${APP_PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      // The production-shaped server: the api process with the built web
      // bundle behind it. The database lives in a throwaway file.
      command: "node apps/api/dist/server/index.mjs",
      cwd: "../..",
      url: `http://127.0.0.1:${APP_PORT}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        // Not "production": the admin inbox endpoint that reads the
        // captured one-time code is disabled in production mode. The
        // built artifact serves the ui the same way in every mode.
        NODE_ENV: "test",
        PORT: String(APP_PORT),
        DATABASE_URL: "/tmp/tarima-e2e-playwright.db",
        SESSION_SECRET: "e2e-playwright-session",
        INBOUND_WEBHOOK_SECRET: WEBHOOK_SECRET,
        EMAIL_LOOPBACK_DOMAINS: "tarima.test,bluenote.test",
        MAIL_FROM: "outreach@tarima.test",
        ENGINE_STEP_POLL_MS: "50",
        ENGINE_OUTBOX_INTERVAL_MS: "50",
        ENGINE_FOLLOW_UP_DELAY_MS: "3600000",
        LLM_BASE_URL: "",
        BREVO_API_KEY: "",
        TELEGRAM_BOT_TOKEN: "",
      },
    },
  ],
});
