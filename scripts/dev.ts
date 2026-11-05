#!/usr/bin/env node
/**
 * One-command local dev and preview.
 *
 *   node scripts/dev.ts           # vite dev (apps/web) + channel mocks
 *   node scripts/dev.ts --preview # built .output server + channel mocks
 *
 * Both modes:
 *   - boot the three channel mocks (telegram :3511, whatsapp :3512,
 *     mail :3513) via tests/channels/mock-boot.mjs
 *   - resolve the LLM key from BIFROST_VK or the macOS Keychain
 *     (`security find-generic-password -s bifrost -w`); with neither,
 *     fall back to the deterministic stub LLM (TARIMA_AGENT_STUB=1)
 *   - prefix child logs ([mock] / [web]) and kill everything on exit
 *   - print the dev-login URL once the server answers /api/health
 *
 * The eve runtime is not a third child: in dev, the existing
 * `ensureEveBuild()` in apps/web/agent/runtime.ts builds and mounts it
 * in-process on demand (TARIMA_EVE_PORT); in preview, the built
 * .output server mounts it the same way.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const WEB = join(ROOT, "apps", "web");
const PREVIEW = process.argv.includes("--preview");
const WEB_PORT = Number(process.env.WEB_PORT ?? 3000);
const EVE_PORT = process.env.TARIMA_EVE_PORT ?? "4310";

/** Load .env.local (KEY=VALUE lines) without clobbering the real env. */
function loadEnvLocal() {
  const file = join(ROOT, ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2]!;
  }
}

loadEnvLocal();

const children = [];
let exiting = false;

function killAll() {
  if (exiting) return;
  exiting = true;
  for (const child of children) {
    try {
      child.kill("SIGTERM");
    } catch {}
  }
  // Native listeners (better-sqlite3 servers, mocks) can ignore SIGTERM
  // briefly; the process group is gone with this process anyway, but be
  // explicit so a re-run never hits a busy port.
  setTimeout(() => {
    for (const child of children) {
      try {
        child.kill("SIGKILL");
      } catch {}
    }
  }, 2000).unref();
}

process.on("SIGINT", () => {
  killAll();
  process.exit(130);
});
process.on("SIGTERM", () => {
  killAll();
  process.exit(143);
});
process.on("exit", killAll);

/** BIFROST_VK from env, else the macOS Keychain, else the stub LLM. */
function resolveLlm() {
  if (process.env.BIFROST_VK) {
    console.log("[llm] BIFROST_VK from environment");
    return;
  }
  const keychain = spawnSync("security", ["find-generic-password", "-s", "bifrost", "-w"], {
    encoding: "utf8",
  });
  if (keychain.status === 0 && keychain.stdout.trim()) {
    process.env.BIFROST_VK = keychain.stdout.trim();
    console.log("[llm] BIFROST_VK from Keychain");
    return;
  }
  process.env.TARIMA_AGENT_STUB = "1";
  console.log("[llm] no BIFROST_VK (env or Keychain): deterministic stub LLM");
}

function prefixed(name) {
  return (data) => {
    for (const line of data.toString().split("\n")) {
      if (line) console.log(`[${name}] ${line}`);
    }
  };
}

function startChild(name, cmd, args, opts = {}) {
  const child = spawn(cmd, args, {
    cwd: opts.cwd ?? ROOT,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", prefixed(name));
  child.stderr.on("data", prefixed(name));
  child.on("exit", (code) => {
    if (!exiting && code !== 0 && code !== null) {
      console.error(`[${name}] exited with ${code}; shutting down`);
      killAll();
      process.exitCode = code;
    }
  });
  children.push(child);
  return child;
}

async function waitHealthy(url, tries = 180, delayMs = 500) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

resolveLlm();

const mockBoot = join(WEB, "tests", "channels", "mock-boot.mjs");
const tgPort = process.env.TELEGRAM_PORT ?? 3511;
const waPort = process.env.WHATSAPP_PORT ?? 3512;
const mailPort = process.env.MAIL_PORT ?? 3513;
startChild("mock", process.execPath, [mockBoot, String(tgPort), String(waPort), String(mailPort)]);
process.env.TELEGRAM_API_BASE_URL ??= `http://127.0.0.1:${tgPort}`;
process.env.WHATSAPP_API_BASE_URL ??= `http://127.0.0.1:${waPort}`;
process.env.MAIL_API_BASE_URL ??= `http://127.0.0.1:${mailPort}`;
process.env.TARIMA_EVE_PORT = EVE_PORT;

if (PREVIEW) {
  const entry = join(WEB, "dist", "server", "server", "index.mjs");
  if (!existsSync(entry)) {
    console.error(`[preview] missing ${join(WEB, "dist")}; run: pnpm build && pnpm build:eve`);
    process.exit(1);
  }
  process.env.PORT = String(WEB_PORT);
  process.env.NODE_ENV ??= "development";
  startChild("web", process.execPath, [entry], { cwd: WEB });
} else {
  // vite dev mounts the in-process eve runtime itself: the server entry
  // (src/server.ts) calls mountEveRuntime(), which builds .output/ on
  // demand via ensureEveBuild(); only build processes skip the mount.
  const viteBin = join(WEB, "node_modules", "vite", "bin", "vite.js");
  startChild("web", process.execPath, [viteBin, "dev", "--host", "--port", String(WEB_PORT)], {
    cwd: WEB,
  });
}

const base = `http://127.0.0.1:${WEB_PORT}`;
const healthy = await waitHealthy(`${base}/api/health`);
if (!healthy) {
  console.error(`[dev] ${base}/api/health never became healthy`);
  killAll();
  process.exit(1);
}
console.log(`\n  tarima:    ${base}`);
console.log(`  eve:       http://127.0.0.1:${EVE_PORT}/eve/v1/health`);
console.log(`  dev-login: ${base}/api/dev/login?email=you%40tarima.test\n`);
console.log("ctrl-c stops everything.");
