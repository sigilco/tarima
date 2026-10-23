#!/usr/bin/env node
/**
 * Backpressure gate for the TS workspace: typecheck + lint + format +
 * manifest hygiene + tests + knip. `--quick` skips tests and knip (the
 * slow, memory-bound steps) so pre-commit stays near the 10s target.
 * Timings printed per step; full output only on failure.
 *
 *   pnpm validate          # full (pre-push, CI)
 *   pnpm validate --quick  # static-only (pre-commit)
 */
import { spawnSync } from "node:child_process";
import { performance } from "node:perf_hooks";

const QUICK = process.argv.includes("--quick");

interface Step {
  name: string;
  cmd: string;
  args: string[];
  skipInQuick?: boolean;
}

const steps: Step[] = [
  { name: "typecheck", cmd: "pnpm", args: ["-r", "run", "typecheck"] },
  { name: "lint", cmd: "pnpm", args: ["exec", "oxlint", "."] },
  { name: "format", cmd: "pnpm", args: ["exec", "oxfmt", "--check", "."] },
  { name: "workspace-manifests", cmd: "node", args: ["scripts/check-workspace-manifests.ts"] },
  { name: "test", cmd: "pnpm", args: ["-r", "run", "test"], skipInQuick: true },
  { name: "knip", cmd: "pnpm", args: ["exec", "knip"], skipInQuick: true },
];

let failed = 0;
const timings: string[] = [];

for (const step of steps) {
  if (step.skipInQuick && QUICK) {
    console.log(`SKIP ${step.name} (--quick)`);
    continue;
  }
  const t0 = performance.now();
  const r = spawnSync(step.cmd, step.args, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
  const ms = Math.round(performance.now() - t0);
  const ok = r.status === 0;
  if (!ok) {
    failed++;
    console.log(`FAIL ${step.name} (${ms}ms)`);
    if (r.stdout) process.stdout.write(r.stdout);
    if (r.stderr) process.stderr.write(r.stderr);
  } else {
    console.log(`OK   ${step.name} (${ms}ms)`);
  }
  timings.push(`${step.name}=${ms}ms`);
}

if (failed > 0) {
  console.error(`\nvalidate: ${failed} step(s) failed`);
  process.exit(1);
}
console.log(`\nvalidate: all steps passed [${timings.join(", ")}]${QUICK ? " (quick)" : ""}`);
