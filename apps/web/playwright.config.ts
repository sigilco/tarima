import { defineConfig } from "@playwright/test";

/**
 * E2E smoke (stream: brief-to-board).
 *
 * The config expects the unified runtime (`pnpm -C apps/api dev`, which
 * serves the web app on :3001) and a throwaway sqlite database, both
 * provided by the smoke script (`pnpm -C apps/web run test:e2e`).
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    trace: "retain-on-failure",
  },
  expect: { timeout: 10_000 },
});
