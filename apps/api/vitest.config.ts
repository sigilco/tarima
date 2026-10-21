import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    // Each test file opens its own sqlite file; keep them in separate
    // processes so DATABASE_URL setup per file does not leak across files.
    pool: "forks",
  },
});
