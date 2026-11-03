import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/api/**/*.test.ts"],
    // Each suite boots its own api process against its own sqlite file;
    // forked processes keep the environment and ports isolated per file.
    pool: "forks",
    // The P0 loop waits on the engine; keep the per-test budget generous.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
