import { defineConfig } from "vitest/config";
import { join } from "node:path";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

// The agent mirror tests write through @tarima/api/db, which opens the
// sqlite file at import time. Point that shared import at a fresh temp
// database before any test module loads.
process.env.DATABASE_URL = join(mkdtempSync(join(tmpdir(), "tarima-web-test-")), "test.db");

export default defineConfig({
  test: {
    // Pure-logic tests plus the agent mirror seam (lib/mirror.ts, the
    // approval policy): no DOM environment, so the suite stays fast.
    include: ["src/**/*.test.ts", "agent/**/*.test.ts"],
    environment: "node",
  },
});
