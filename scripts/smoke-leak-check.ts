#!/usr/bin/env node
/**
 * Leak self-check for scripts/smoke.ts.
 *
 * Proves smoke always stops what it starts:
 *   A. failure path — SMOKE_FORCE_FAIL=1 makes a check fail after the
 *      children are up; smoke must exit non-zero and leave no child
 *      pids or process groups behind.
 *   B. SIGTERM path — smoke is signalled mid-run; same assertion.
 *
 * Requires the web build (apps/web/dist) like the smoke gate itself.
 *
 *   node scripts/smoke-leak-check.ts
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SMOKE = join(ROOT, "scripts", "smoke.ts");
const DIST = join(ROOT, "apps", "web", "dist", "server", "server", "index.mjs");

if (!existsSync(DIST)) {
  console.error("smoke-leak-check: no web build; run: pnpm build");
  process.exit(2);
}

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === "EPERM";
  }
};
const groupAlive = (pid) => {
  try {
    process.kill(-pid, 0);
    return true;
  } catch {
    return false;
  }
};

function runSmoke(env, { sigtermAfterPids = false } = {}) {
  return new Promise((resolveRun) => {
    const child = spawn(process.execPath, [SMOKE], {
      env: { ...process.env, SMOKE_REPORT_CHILDREN: "1", ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const pids = new Map(); // pid -> name
    let out = "";
    let err = "";
    const onData = (buf, sink) => {
      const s = buf.toString();
      sink += s;
      for (const m of s.matchAll(/child (\S+) pid=(\d+)/g)) pids.set(Number(m[2]), m[1]);
      return sink;
    };
    child.stdout.on("data", (b) => (out = onData(b, out)));
    child.stderr.on("data", (b) => (err = onData(b, err)));
    child.on("exit", (code, signal) => resolveRun({ code, signal, pids, out, err }));
    if (sigtermAfterPids) {
      const timer = setInterval(() => {
        if (pids.size >= 2) {
          clearInterval(timer);
          child.kill("SIGTERM");
        }
      }, 100);
      setTimeout(() => clearInterval(timer), 50_000).unref();
    }
  });
}

const leftovers = (pids) => {
  const bad = [];
  for (const [pid, name] of pids) {
    if (alive(pid) || groupAlive(pid)) bad.push(`${name}:${pid}`);
  }
  return bad;
};

let failures = 0;
const check = (label, cond, detail = "") => {
  console.log(`${cond ? "OK  " : "FAIL"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!cond) failures++;
};

// A. Deliberate failure: smoke must exit non-zero and reap its children.
{
  const r = await runSmoke({ SMOKE_FORCE_FAIL: "1", SMOKE_PORT: "3951" });
  check("failure run exits non-zero", r.code !== 0, `code=${r.code}`);
  check("failure run spawned children", r.pids.size >= 2, [...r.pids.values()].join(","));
  const bad = leftovers(r.pids);
  check("failure run leaves no child pids/groups", bad.length === 0, bad.join(","));
  if (bad.length) console.error(r.err.slice(-2000));
}

// B. SIGTERM mid-run: same contract.
{
  const r = await runSmoke({ SMOKE_PORT: "3952" }, { sigtermAfterPids: true });
  check(
    "SIGTERM run exits",
    r.code !== null || r.signal !== null,
    `code=${r.code} sig=${r.signal}`,
  );
  check("SIGTERM run spawned children", r.pids.size >= 2, [...r.pids.values()].join(","));
  const bad = leftovers(r.pids);
  check("SIGTERM run leaves no child pids/groups", bad.length === 0, bad.join(","));
  if (bad.length) console.error(r.err.slice(-2000));
}

console.log(
  failures === 0 ? "\nsmoke-leak-check: PASS" : `\nsmoke-leak-check: ${failures} FAILURES`,
);
process.exit(failures === 0 ? 0 : 1);
