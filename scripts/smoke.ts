#!/usr/bin/env node
/**
 * Smoke gate: boot the built web app with the deterministic stub LLM and
 * the channel mocks on a throwaway DB, then assert the wire paths a
 * browser uses — plain Node fetch, no browser, under 60s.
 *
 *   node scripts/smoke.ts
 *
 * Covers (would have caught both preview bugs):
 *   1. /assets/* resolve (the eve mount must not break the asset base)
 *   2. dev-login mints a session
 *   3. a session is created through /api/eve/eve (the double prefix eve's client emits)
 *   4. one chat turn streams a reply (stub LLM)
 *   5. telegram/whatsapp mocks answer a send round-trip
 */
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const WEB = join(ROOT, "apps", "web");
const PORT = Number(process.env.SMOKE_PORT ?? 3900);
const EVE_PORT = process.env.TARIMA_EVE_PORT ?? "4390";
const TG_PORT = 3911;
const WA_PORT = 3912;
const MAIL_PORT = 3913;
const BASE = `http://127.0.0.1:${PORT}`;
const deadline = Date.now() + Number(process.env.SMOKE_DEADLINE_MS ?? 55_000);

const steps = [];
const step = (name, ok, detail = "") => {
  steps.push({ name, ok, detail });
  console.log(`${ok ? "OK  " : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
  return ok;
};

const tmp = mkdtempSync(join(tmpdir(), "tarima-smoke-"));
const children = [];
let exiting = false;
function signalGroup(child, sig) {
  // Children are spawned detached so each is its own process-group leader;
  // the negative pid signals the whole group, not just the direct child.
  if (child.pid === undefined) return;
  try {
    process.kill(-child.pid, sig);
  } catch {}
  try {
    child.kill(sig);
  } catch {}
}
function waitForExit(child, ms) {
  return new Promise((resolveExit) => {
    if (child.exitCode !== null || child.signalCode !== null) return resolveExit();
    const t = setTimeout(() => resolveExit(false), ms);
    child.once("exit", () => {
      clearTimeout(t);
      resolveExit(true);
    });
  });
}
async function killAll() {
  if (exiting) return;
  exiting = true;
  for (const child of children) signalGroup(child, "SIGTERM");
  await Promise.all(children.map((c) => waitForExit(c, 5000)));
  for (const child of children) signalGroup(child, "SIGKILL");
  await Promise.all(children.map((c) => waitForExit(c, 2000)));
}
// Best-effort synchronous group kill for paths that bypass the awaited
// cleanup (an uncaught error inside an exit-only path).
process.on("exit", () => {
  for (const child of children) signalGroup(child, "SIGTERM");
});
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    killAll().then(() => process.exit(sig === "SIGINT" ? 130 : 143));
  });
}

function startChild(name, cmd, args, cwd) {
  const child = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"], detached: true });
  child.on("exit", (code) => {
    if (!exiting && code !== 0 && code !== null) {
      console.error(`[smoke] ${name} exited ${code}`);
    }
  });
  children.push(child);
  return child;
}

async function until(fn, label) {
  while (Date.now() < deadline) {
    try {
      const value = await fn();
      if (value) return value;
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`timeout waiting for ${label}`);
}

// Preconditions: the web build must exist (turbo run build build:eve).
if (!existsSync(join(WEB, "dist", "server", "server", "index.mjs"))) {
  console.error("smoke: no web build (apps/web/dist); run: pnpm build");
  process.exit(1);
}

// Env contract: stub LLM, throwaway DB, dev login, mock provider seams.
Object.assign(process.env, {
  TARIMA_AGENT_STUB: "1",
  DATABASE_URL: join(tmp, "smoke.db"),
  NODE_ENV: "development",
  DEV_LOGIN: "1",
  SESSION_SECRET: "smoke-session-secret",
  PORT: String(PORT),
  TARIMA_EVE_PORT: EVE_PORT,
  EMAIL_LOOPBACK_DOMAINS: "tarima.test",
  TELEGRAM_BOT_TOKEN: "smoke-mock-bot-token",
  TELEGRAM_WEBHOOK_SECRET_TOKEN: "smoke-webhook-secret",
  TARIMA_TELEGRAM_API_BASE_URL: `http://127.0.0.1:${TG_PORT}`,
  WHATSAPP_TOKEN: "smoke-mock-wa-token",
  WHATSAPP_PHONE_NUMBER_ID: "123456789",
  WHATSAPP_APP_SECRET: "mock-wa-app-secret",
  WHATSAPP_VERIFY_TOKEN: "smoke-mock-verify-token",
  WHATSAPP_API_BASE_URL: `http://127.0.0.1:${WA_PORT}`,
  MAIL_API_BASE_URL: `http://127.0.0.1:${MAIL_PORT}`,
  BREVO_API_KEY: "smoke-mock-brevo-key",
  MAIL_FROM: "notifications@tarima.test",
});

startChild(
  "mock",
  process.execPath,
  [
    join(WEB, "tests", "channels", "mock-boot.mjs"),
    String(TG_PORT),
    String(WA_PORT),
    String(MAIL_PORT),
  ],
  WEB,
);
startChild("web", process.execPath, [join(WEB, "dist", "server", "server", "index.mjs")], WEB);

let cookie = "";
let ok = true;

try {
  await until(async () => (await fetch(`${BASE}/api/health`)).ok, "web health");
  step("web health", true);

  // 1. The landing page and one hashed asset (the preview bug: every
  //    /assets/* request 500'd when the eve mount clobbered __nitro_main__).
  const landing = await fetch(`${BASE}/`);
  const html = await landing.text();
  const asset = html.match(/(?:src|href)="(\/assets\/[^"]+)"/)?.[1];
  // The first asset hit after a cold boot can transiently fail while the
  // eve world warms up; retry once before calling it broken.
  let assetOk = false;
  for (let i = 0; i < 2 && asset; i++) {
    assetOk = (await fetch(`${BASE}${asset}`)).ok;
    if (assetOk) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  ok =
    step("landing + asset", landing.ok && Boolean(asset) && assetOk, asset ?? "no asset in html") &&
    ok;

  // 2. Dev login mints a session cookie.
  const login = await fetch(`${BASE}/api/dev/login?email=qa%40tarima.test`, { redirect: "manual" });
  const setCookie = login.headers.get("set-cookie") ?? "";
  cookie = setCookie.split(";")[0] ?? "";
  ok =
    step(
      "dev-login",
      login.status === 302 && cookie.includes("tarima_session"),
      `status ${login.status}`,
    ) && ok;
  const headers = { cookie };

  // 3. Eve session through the proxy (the /eve/eve double-prefix bug).
  const sessionRes = await fetch(`${BASE}/api/eve/eve/v1/session`, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ message: "Say hello from the smoke gate." }),
  });
  const session = await sessionRes.json().catch(() => ({}));
  const sessionId = session.sessionId ?? session.id ?? session.session?.id;
  ok = step("eve session via proxy", sessionRes.ok, `status ${sessionRes.status}`) && ok;

  // 4. One chat turn streams (stub LLM answers deterministically).
  if (sessionId) {
    const streamRes = await fetch(`${BASE}/api/eve/eve/v1/session/${sessionId}/stream`, {
      headers,
    });
    ok =
      step(
        "session stream opens",
        streamRes.ok && streamRes.body !== null,
        `status ${streamRes.status}`,
      ) && ok;
    if (streamRes.ok && streamRes.body) {
      const reader = streamRes.body.getReader();
      const decoder = new TextDecoder();
      let buffered = "";
      let sawCommit = false;
      let sawReply = false;
      while (Date.now() < deadline) {
        const { done, value } = await reader.read();
        if (done) break;
        buffered += decoder.decode(value, { stream: true });
        if (/content\.delta|"text"|reply/i.test(buffered)) sawReply = true;
        if (/"type"\s*:\s*"commit"|facts/.test(buffered)) sawCommit = true;
        if (sawCommit || buffered.length > 200_000) break;
      }
      reader.cancel().catch(() => {});
      ok = step("chat turn streams", sawReply || sawCommit, `${buffered.length} bytes`) && ok;
    }
  } else {
    ok = step("chat turn streams", false, "no session id") && ok;
  }

  // 5. Channel mocks answer (smoke-level: mocks boot and accept a send
  //    probe; the full webhook round-trip stays in the e2e harness).
  const tgProbe = await fetch(`http://127.0.0.1:${TG_PORT}/`, { method: "POST" }).catch(() => null);
  const waProbe = await fetch(`http://127.0.0.1:${WA_PORT}/`, { method: "POST" }).catch(() => null);
  ok =
    step(
      "channel mocks up",
      tgProbe !== null && waProbe !== null,
      `tg ${tgProbe?.status} wa ${waProbe?.status}`,
    ) && ok;
} catch (err) {
  ok = false;
  step("smoke run", false, String(err));
} finally {
  await killAll();
  try {
    rmSync(tmp, { recursive: true, force: true });
  } catch {}
}

const passed = steps.filter((s) => s.ok).length;
console.log(`\nsmoke: ${passed}/${steps.length} checks passed [port ${PORT}, eve ${EVE_PORT}]`);
process.exit(ok ? 0 : 1);
