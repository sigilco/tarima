#!/usr/bin/env node
/**
 * Tiered validation gate.
 *
 *   node scripts/validate.ts --quick   static tier: turbo typecheck+lint,
 *                                      oxfmt, workspace manifests (~10s cold)
 *   node scripts/validate.ts           full tier: quick + turbo test + knip
 *
 * The typecheck/lint/test steps route through ONE `turbo run --continue`
 * call so the paraglide compile-messages dependency is scheduled once
 * (three separate calls race it). Light steps (format check, manifests)
 * run in parallel with it. Timings land in
 * ~/.local/share/tarima/gate-timings.json.
 *
 * With no TS/JSON/CSS/lockfile change vs origin/main the gate self-skips
 * (docs-only commits stay cheap); in CI a missing origin/main hard-fails.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { performance } from "node:perf_hooks";

const QUICK = process.argv.includes("--quick");
const ROOT = resolve(import.meta.dirname, "..");
const CI = process.env.CI === "true";
const CODE_GLOBS = ["*.ts", "*.tsx", "*.mjs", "*.js", "*.json", "*.css", "pnpm-lock.yaml"];

/** True when the branch or the staged working tree has code changes vs origin/main. */
function hasCodeChanges(): boolean {
  const haveBase =
    spawnSync("git", ["rev-parse", "--verify", "origin/main"], { encoding: "utf8" }).status === 0;
  if (!haveBase) {
    if (CI) {
      console.error("validate: origin/main is missing in CI; cannot scope the gate");
      process.exit(1);
    }
    return true; // no upstream to compare: run everything
  }
  const opts = { encoding: "utf8", cwd: ROOT } as const;
  const committed = spawnSync(
    "git",
    ["diff", "--name-only", "origin/main...HEAD", "--", ...CODE_GLOBS],
    opts,
  );
  const staged = spawnSync("git", ["diff", "--cached", "--name-only", "--", ...CODE_GLOBS], opts);
  return `${committed.stdout ?? ""}${staged.stdout ?? ""}`.trim().length > 0;
}

function recordTimings(tier: "quick" | "full", ms: number): void {
  try {
    const dir = join(homedir(), ".local", "share", "tarima");
    mkdirSync(dir, { recursive: true });
    const file = join(dir, "gate-timings.json");
    const prev: unknown[] = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
    prev.push({ at: new Date().toISOString(), tier, ms });
    writeFileSync(file, JSON.stringify(prev.slice(-50), null, 2));
  } catch {
    // timings are best-effort; never fail the gate on them
  }
}

interface StepResult {
  name: string;
  ok: boolean;
  ms: number;
  skipped?: boolean;
}

async function runTurbo(steps: string[]): Promise<StepResult> {
  const t0 = performance.now();
  const child = spawn("pnpm", ["exec", "turbo", "run", ...steps, "--continue"], {
    cwd: ROOT,
    stdio: ["ignore", "inherit", "inherit"],
  });
  const code = await new Promise<number | null>((resolve) => child.on("exit", resolve));
  return {
    name: `turbo(${steps.join("+")})`,
    ok: code === 0,
    ms: Math.round(performance.now() - t0),
  };
}

function runStep(name: string, cmd: string, args: string[]): StepResult {
  const t0 = performance.now();
  const r = spawnSync(cmd, args, { encoding: "utf8", cwd: ROOT });
  const ms = Math.round(performance.now() - t0);
  if (r.status !== 0) {
    console.log(`FAIL ${name} (${ms}ms)`);
    if (r.stdout) process.stdout.write(r.stdout.slice(-4000));
    if (r.stderr) process.stderr.write(r.stderr.slice(-4000));
  }
  return { name, ok: r.status === 0, ms };
}

const turboSteps = QUICK ? ["typecheck", "lint"] : ["typecheck", "lint", "test"];
const lightSteps: Array<[string, string, string[]]> = [
  ["oxfmt", "pnpm", ["exec", "oxfmt", "--check", "."]],
  ["manifests", "node", ["scripts/check-workspace-manifests.ts"]],
];
if (!QUICK) lightSteps.push(["knip", "pnpm", ["exec", "knip"]]);

if (!hasCodeChanges()) {
  console.log("SKIP validate: no code changes vs origin/main");
  recordTimings(QUICK ? "quick" : "full", 0);
  process.exit(0);
}

const [turbo, ...lights] = await Promise.all([
  runTurbo(turboSteps),
  ...lightSteps.map(([name, cmd, args]) => runStep(name, cmd, args)),
]);

const all = [turbo, ...lights];
const failed = all.filter((s) => !s.ok);
for (const s of all) {
  if (s.ok) console.log(`OK   ${s.name} (${s.ms}ms)`);
}
const total = all.reduce((sum, s) => sum + s.ms, 0);
recordTimings(QUICK ? "quick" : "full", total);

if (failed.length > 0) {
  console.error(`\nvalidate: ${failed.length} step(s) failed`);
  process.exit(1);
}
console.log(
  `\nvalidate: all steps passed [${all.map((s) => `${s.name}=${s.ms}ms`).join(", ")}]${QUICK ? " (quick)" : ""}`,
);
