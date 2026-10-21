import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Pure-logic tests only: the board rules, the csv preview and the
    // search parsing. No DOM environment, so the suite stays fast.
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
