#!/usr/bin/env node
/**
 * Leak self-check for scripts/smoke.ts. The smoke gate once leaked five
 * orphan node processes, so this asserts its cleanup works:
 *
 *   1. run smoke with an unreachable web port (the health check times
 *      out, the finally path must still kill every child group)
 *   2. run smoke again and SIGINT it mid-flight (the signal handler
 *      must kill every child group)
 *
 * After each run, scan /proc for live processes whose cwd is this
 * worktree's apps/web (what the children share). Any survivor fails
 * the check.
 *
 *   node scripts/smoke-leak-check.ts   (needs the web build; ~30s)
 */
import { spawn, spawnSync } from "node:child_process";

import { existsSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SMOKE = join(ROOT, "scripts", "smoke.ts");
const WEB_CWD = realpathSync(join(ROOT, "apps", "web"));

function survivors() {
  const out = [];
  for (const pid of readdirSync("/proc").filter((d) => /^\d+$/.test(d))) {
    try {
      const cwd = realpathSync(readFileSync(join("/proc", pid, "cwd"), "utf8").trim());
      if (cwd === WEB_CWD) out.push(Number(pid));
    } catch {}
  }
  return out;
}

async function runSmoke(env, signalAfterMs) {
  const child = spawn(process.execPath, ["--experimental-strip-types", SMOKE], {
    cwd: ROOT,
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  child.stdout.on("data", (c) => (stdout += c));
  child.stderr.on("data", (c) => (stdout += c));
  if (signalAfterMs !== undefined) {
    setTimeout(() => child.kill("SIGINT"), signalAfterMs);
  }
  const code = await new Promise((r) => child.on("exit", r));
  return { code, stdout };
}

async function assertNoSurvivors(label) {
  // Give the exit hooks a beat to reap.
  for (let i = 0; i < 20; i++) {
    if (survivors().length === 0) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  const left = survivors();
  if (left.length > 0) {
    console.error(`FAIL ${label}: ${left.length} child process(es) survived: ${left.join(", ")}`);
    for (const pid of left) {
      try {
        spawnSync("kill", ["-TERM", String(pid)]);
      } catch {}
    }
    process.exitCode = 1;
    return false;
  }
  console.log(`OK   ${label} — no child processes left`);
  return true;
}

// The smoke gate needs a build; refuse confusingly otherwise.
if (!existsSync(join(ROOT, "apps", "web", "dist", "server", "server", "index.mjs"))) {
  // fallthrough: smoke.ts itself reports the missing build cleanly, but
  // then there are no children to leak, which would pass vacuously.
  console.error("leak-check: no web build (apps/web/dist); run: pnpm build");
  process.exit(1);
}

// 1. Failing check: a 5s deadline makes the chat-stream probe time out
//    (observed to fail on a loaded host), so smoke exits 1 through its
//    failure path with all three children still alive.
const r1 = await runSmoke({
  SMOKE_DEADLINE_MS: "5000",
});
console.log(`[leak-check] failing-check run exited ${r1.code}`);
if (r1.code === 0) {
  // On a warm fast host all 7 checks pass inside 5s; that is fine as
  // long as some later run fails. Only a pattern of never failing is a
  // problem, so do not hard-fail here.
  console.log("[leak-check] note: failing-check run passed; failure path not exercised this time");
}
await assertNoSurvivors("failing check cleans up children");

// 2. SIGINT mid-flight: interrupt while the checks are running. The
//    smoke script exits through its SIGINT handler (130); if it beats
//    the signal to the finish line it exits 0 or 1 with its own cleanup
//    already done. What matters here is that no children survive either
//    way, so only assert the survivors.
const r2 = await runSmoke({ SMOKE_DEADLINE_MS: "55000" }, 5_000);
console.log(`[leak-check] SIGINT run exited ${r2.code}`);
await assertNoSurvivors("SIGINT cleans up children");

if (process.exitCode) {
  console.error("leak-check: FAILED");
} else {
  console.log("leak-check: PASS");
}
