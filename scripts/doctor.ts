#!/usr/bin/env node
/**
 * Environment doctor: `mise run doctor` (or `node scripts/doctor.ts`).
 *
 * Reports, without ever printing a value:
 *   - every env var tarima reads: present or missing, and what it is for
 *   - Node 24 / pnpm / installed deps
 *   - the ports `mise run dev` needs (web, eve, channel mocks)
 *   - the SQLite DB path is writable
 *   - which providers are live vs replay/mock vs off
 *
 * Exit code is non-zero ONLY for blockers (wrong Node, missing pnpm or
 * deps, a needed port already bound, DB not writable). Missing optional
 * env vars and replay providers are reported, not fatal — the stub-LLM
 * dev loop works with zero secrets.
 *
 * The check logic is exported and unit-tested
 * (apps/api/src/lib/repo-doctor.test.ts); the CLI wiring at the bottom
 * only runs when the file is executed directly.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { connect } from "node:net";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(import.meta.dirname, "..");

// ---------------------------------------------------------------------------
// Env var spec: name → what it is for. `recommended` marks vars that make
// the first real event meaningfully better but are not blockers.
// ---------------------------------------------------------------------------

export interface EnvSpec {
  name: string;
  need: string;
  recommended?: boolean;
}

export const ENV_SPEC: EnvSpec[] = [
  { name: "DATABASE_URL", need: "SQLite path (default tarima.db)" },
  {
    name: "DEV_LOGIN",
    need: "instant /api/dev/login (default on outside production)",
    recommended: true,
  },
  { name: "BETA_ALLOWLIST", need: "comma-separated emails allowed to log in (empty = open)" },
  {
    name: "SESSION_SECRET",
    need: "session cookie signing (dev default is insecure)",
    recommended: true,
  },
  { name: "EMAIL_LOOPBACK_DOMAINS", need: "mail domains captured locally (default tarima.test)" },
  { name: "MAIL_FROM", need: "outbound mail sender address" },
  {
    name: "BREVO_API_KEY",
    need: "real outbound mail via Brevo (else loopback/stdout)",
    recommended: true,
  },
  { name: "INBOUND_WEBHOOK_SECRET", need: "inbound email webhook auth" },
  { name: "WEB_PORT", need: "vite dev / preview port (default 3000)", recommended: true },
  { name: "TARIMA_EVE_PORT", need: "in-process eve runtime port (default 4310)" },
  {
    name: "BIFROST_VK",
    need: "LLM gateway virtual key (else deterministic stub)",
    recommended: true,
  },
  { name: "BIFROST_BASE_URL", need: "LLM gateway URL (default http://127.0.0.1:8317/v1)" },
  { name: "TARIMA_AGENT_MODEL", need: "gateway model id (default zai-coding-plan/glm-5)" },
  { name: "TELEGRAM_BOT_TOKEN", need: "live Telegram bot (else channel idle)" },
  { name: "TELEGRAM_WEBHOOK_SECRET_TOKEN", need: "Telegram webhook signature check" },
  { name: "TARIMA_TELEGRAM_API_BASE_URL", need: "Telegram Bot API override (mock seam)" },
  { name: "TELEGRAM_API_BASE_URL", need: "Telegram mock seam set by scripts/dev.ts" },
  { name: "WHATSAPP_ACCESS_TOKEN", need: "live WhatsApp Cloud API sends" },
  { name: "WHATSAPP_APP_SECRET", need: "WhatsApp webhook signature check" },
  { name: "WHATSAPP_PHONE_NUMBER_ID", need: "WhatsApp sender number id" },
  { name: "WHATSAPP_VERIFY_TOKEN", need: "WhatsApp webhook verify handshake" },
  { name: "WHATSAPP_API_BASE_URL", need: "WhatsApp Graph API mock seam" },
  { name: "WHATSAPP_API_URL", need: "adapter-native Graph API override" },
  { name: "WHATSAPP_TOKEN", need: "api-side WhatsApp outbound provider token" },
  {
    name: "CAUCE_BASE_URL",
    need: "local cauce search/crawl service (default http://127.0.0.1:4479)",
  },
  { name: "GOOGLE_MAPS_API_KEY", need: "Google Places tier (off unless ENABLED=1)" },
  { name: "GOOGLE_PLACES_ENABLED", need: "master switch for the Google tier (default off)" },
  { name: "FSQ_API_KEY", need: "Foursquare venue details (off when unset)" },
  { name: "VITE_API_ORIGIN", need: "browser API origin (defaults to dev server)" },
  { name: "VITE_SITE_ORIGIN", need: "canonical site origin for SEO" },
];

// ---------------------------------------------------------------------------
// Pure checks (unit-tested)
// ---------------------------------------------------------------------------

export interface CheckResult {
  name: string;
  ok: boolean;
  blocker: boolean;
  detail: string;
}

/** Node major must be 24 (mise.toml pins it). */
export function checkNodeVersion(version: string): CheckResult {
  const major = Number.parseInt(version.split(".")[0] ?? "", 10);
  const ok = major === 24;
  return {
    name: "node",
    ok,
    blocker: !ok,
    detail: ok ? `v${version}` : `v${version} — need Node 24 (mise provides it)`,
  };
}

/** pnpm must be on PATH (mise provides the pinned version). */
export function checkPnpm(
  run: (cmd: string, args: string[]) => { status: number | null; stdout: string },
): CheckResult {
  const r = run("pnpm", ["--version"]);
  if (r.status !== 0) {
    return {
      name: "pnpm",
      ok: false,
      blocker: true,
      detail: "pnpm not found — run via `mise run doctor` or install pnpm",
    };
  }
  return { name: "pnpm", ok: true, blocker: false, detail: `v${r.stdout.trim()}` };
}

/** node_modules must exist (deps installed). */
export function checkDepsInstalled(exists: (p: string) => boolean, root: string): CheckResult {
  const ok = exists(join(root, "node_modules"));
  return {
    name: "deps",
    ok,
    blocker: !ok,
    detail: ok
      ? "node_modules present"
      : "node_modules missing — run `pnpm install` (or `mise run setup`)",
  };
}

/** Resolve DATABASE_URL the same way apps/api/src/db/index.ts does. */
export function resolveDbPath(databaseUrl: string | undefined, root: string): string {
  const url = databaseUrl ?? "tarima.db";
  return isAbsolute(url) ? url : resolve(root, url);
}

/** Try to create/write/delete a temp file next to the DB. */
export function checkDbWritable(
  databaseUrl: string | undefined,
  root: string,
  io: {
    mkdirSync: typeof mkdirSync;
    writeFileSync: typeof writeFileSync;
    rmSync: typeof rmSync;
  } = { mkdirSync, writeFileSync, rmSync },
): CheckResult {
  const path = resolveDbPath(databaseUrl, root);
  const probe = join(dirname(path), `.doctor-${process.pid}.tmp`);
  try {
    io.mkdirSync(dirname(path), { recursive: true });
    io.writeFileSync(probe, "ok");
    io.rmSync(probe);
    return { name: "db", ok: true, blocker: false, detail: `${path} writable` };
  } catch (err) {
    return {
      name: "db",
      ok: false,
      blocker: true,
      detail: `${path} not writable: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export type PortState = "free" | "busy";

/** Ports `mise run dev` binds; occupied = blocker. */
export function checkPorts(
  env: Record<string, string | undefined>,
  probe: (port: number) => Promise<PortState>,
): Promise<CheckResult[]> {
  const ports: Array<[string, number]> = [
    ["web (vite dev)", Number(env.WEB_PORT ?? 3000)],
    ["eve runtime", Number(env.TARIMA_EVE_PORT ?? 4310)],
    ["telegram mock", Number(env.TELEGRAM_PORT ?? 3511)],
    ["whatsapp mock", Number(env.WHATSAPP_PORT ?? 3512)],
    ["mail mock", Number(env.MAIL_PORT ?? 3513)],
  ];
  return Promise.all(
    ports.map(async ([label, port]) => {
      const state = await probe(port);
      return {
        name: `port ${port} (${label})`,
        ok: state === "free",
        blocker: state === "busy",
        detail:
          state === "free"
            ? "free"
            : "already bound — stop the other process or change the port env",
      } satisfies CheckResult;
    }),
  );
}

// ---------------------------------------------------------------------------
// Provider classification (pure: env in, verdict out)
// ---------------------------------------------------------------------------

export type ProviderState = "live" | "replay" | "off" | "unknown";

export interface ProviderRow {
  name: string;
  state: ProviderState;
  detail: string;
}

function isLoopbackUrl(url: string | undefined): boolean {
  if (!url) return false;
  return (
    /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?\/?$/.test(url) ||
    url.includes("127.0.0.1")
  );
}

function isSet(env: Record<string, string | undefined>, key: string): boolean {
  const v = env[key];
  return v !== undefined && v !== "";
}

/**
 * Classify each external provider as live / replay (mock or stub) / off.
 * `cauceReachable` is an injected probe result for the local cauce
 * service; undefined means "not probed".
 */
export function providerReport(
  env: Record<string, string | undefined>,
  cauceReachable?: boolean,
): ProviderRow[] {
  const rows: ProviderRow[] = [];

  // LLM: real gateway key → live; stub flag or no key → deterministic replay.
  if (env.TARIMA_AGENT_STUB === "1") {
    rows.push({
      name: "llm",
      state: "replay",
      detail: "TARIMA_AGENT_STUB=1 — deterministic stub replies",
    });
  } else if (isSet(env, "BIFROST_VK")) {
    rows.push({
      name: "llm",
      state: "live",
      detail: `Bifrost gateway (${env.BIFROST_BASE_URL ?? "http://127.0.0.1:8317/v1"})`,
    });
  } else {
    rows.push({
      name: "llm",
      state: "replay",
      detail: "no BIFROST_VK — scripts/dev.ts tries Keychain 'bifrost', else stub",
    });
  }

  // Outbound mail: loopback domains are captured in the DB; Brevo key →
  // live; MAIL_API_BASE_URL loopback → replay; otherwise stdout no-op.
  if (isLoopbackUrl(env.MAIL_API_BASE_URL)) {
    rows.push({
      name: "mail-out",
      state: "replay",
      detail: "MAIL_API_BASE_URL is loopback (mock)",
    });
  } else if (isSet(env, "BREVO_API_KEY")) {
    rows.push({ name: "mail-out", state: "live", detail: "Brevo HTTP API" });
  } else {
    rows.push({
      name: "mail-out",
      state: "off",
      detail: "no BREVO_API_KEY — non-loopback mail logs to stdout",
    });
  }
  rows.push({
    name: "mail-in",
    state: isSet(env, "INBOUND_WEBHOOK_SECRET") ? "live" : "off",
    detail: isSet(env, "INBOUND_WEBHOOK_SECRET")
      ? "inbound webhook armed"
      : "INBOUND_WEBHOOK_SECRET unset — /webhooks/email rejects",
  });

  // Telegram: token + loopback Bot API → replay; token + real → live.
  const tgBase = env.TARIMA_TELEGRAM_API_BASE_URL ?? env.TELEGRAM_API_BASE_URL;
  if (!isSet(env, "TELEGRAM_BOT_TOKEN")) {
    rows.push({
      name: "telegram",
      state: "off",
      detail: "TELEGRAM_BOT_TOKEN unset — channel idle",
    });
  } else if (isLoopbackUrl(tgBase)) {
    rows.push({ name: "telegram", state: "replay", detail: "Bot API pointed at loopback mock" });
  } else {
    rows.push({ name: "telegram", state: "live", detail: "Telegram Bot API" });
  }

  // WhatsApp agent channel (Chat SDK adapter).
  const waBase = env.WHATSAPP_API_URL ?? env.WHATSAPP_API_BASE_URL;
  if (isLoopbackUrl(waBase)) {
    rows.push({
      name: "whatsapp-agent",
      state: "replay",
      detail: "Graph API pointed at loopback mock",
    });
  } else if (isSet(env, "WHATSAPP_ACCESS_TOKEN") && isSet(env, "WHATSAPP_PHONE_NUMBER_ID")) {
    rows.push({ name: "whatsapp-agent", state: "live", detail: "WhatsApp Cloud API" });
  } else {
    rows.push({
      name: "whatsapp-agent",
      state: "off",
      detail: "adapter dev defaults only — no real WhatsApp number configured",
    });
  }
  // WhatsApp outbound provider (@tarima/channels, api notify path).
  rows.push({
    name: "whatsapp-out",
    state: isSet(env, "WHATSAPP_TOKEN") ? "live" : "off",
    detail: isSet(env, "WHATSAPP_TOKEN") ? "Meta Cloud API sends" : "WHATSAPP_TOKEN unset",
  });

  // cauce: local metasearch/crawl service behind sponsor search + enrich.
  if (!isSet(env, "CAUCE_BASE_URL") && cauceReachable === undefined) {
    rows.push({
      name: "cauce",
      state: "unknown",
      detail: "default http://127.0.0.1:4479 — probe skipped",
    });
  } else if (cauceReachable === false) {
    rows.push({
      name: "cauce",
      state: "off",
      detail: "configured but unreachable — sponsor search returns no_cauce",
    });
  } else {
    rows.push({
      name: "cauce",
      state: "live",
      detail: `${env.CAUCE_BASE_URL ?? "http://127.0.0.1:4479"} reachable`,
    });
  }

  // Google Places tier: ships OFF.
  const gEnabled = env.GOOGLE_PLACES_ENABLED === "1" || env.GOOGLE_PLACES_ENABLED === "true";
  rows.push({
    name: "google-places",
    state: gEnabled && isSet(env, "GOOGLE_MAPS_API_KEY") ? "live" : "off",
    detail: gEnabled
      ? isSet(env, "GOOGLE_MAPS_API_KEY")
        ? "enabled with key"
        : "GOOGLE_PLACES_ENABLED set but GOOGLE_MAPS_API_KEY missing"
      : "off by default (GOOGLE_PLACES_ENABLED)",
  });
  rows.push({
    name: "foursquare",
    state: isSet(env, "FSQ_API_KEY") ? "live" : "off",
    detail: isSet(env, "FSQ_API_KEY") ? "FSQ_API_KEY set" : "FSQ_API_KEY unset",
  });

  return rows;
}

// ---------------------------------------------------------------------------
// Env table (present/missing — names only, never values)
// ---------------------------------------------------------------------------

export interface EnvRow {
  name: string;
  state: "set" | "missing";
  need: string;
  recommended: boolean;
}

export function envReport(env: Record<string, string | undefined>): EnvRow[] {
  return ENV_SPEC.map((spec) => ({
    name: spec.name,
    state: isSet(env, spec.name) ? "set" : "missing",
    need: spec.need,
    recommended: spec.recommended ?? false,
  }));
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

/** Load .env.local (KEY=VALUE) without clobbering the real env (dev.ts pattern). */
function loadEnvLocal(): void {
  const file = join(ROOT, ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1]! in process.env)) process.env[m[1]!] = m[2]!;
  }
}

function probePort(port: number): Promise<PortState> {
  return new Promise((resolvePromise) => {
    const socket = connect({ host: "127.0.0.1", port });
    socket.once("connect", () => {
      socket.destroy();
      resolvePromise("busy");
    });
    socket.once("error", () => resolvePromise("free"));
    socket.setTimeout(1000, () => {
      socket.destroy();
      resolvePromise("free");
    });
  });
}

/** TCP-connect probe for the cauce base URL (host:port only). */
async function probeCauce(url: string | undefined): Promise<boolean | undefined> {
  const base = url ?? "http://127.0.0.1:4479";
  try {
    const u = new URL(base);
    const port = Number(u.port || (u.protocol === "https:" ? 443 : 80));
    return await new Promise<boolean>((res) => {
      const socket = connect({ host: u.hostname, port });
      socket.once("connect", () => {
        socket.destroy();
        res(true);
      });
      socket.once("error", () => res(false));
      socket.setTimeout(1000, () => {
        socket.destroy();
        res(false);
      });
    });
  } catch {
    return undefined;
  }
}

const STATE_MARK: Record<ProviderState, string> = {
  live: "LIVE   ",
  replay: "REPLAY ",
  off: "off    ",
  unknown: "unknown",
};

async function main(): Promise<number> {
  loadEnvLocal();
  const env = process.env as Record<string, string | undefined>;
  const results: CheckResult[] = [];
  const blockers: string[] = [];

  results.push(checkNodeVersion(process.versions.node));
  results.push(
    checkPnpm((cmd, args) => {
      const r = spawnSync(cmd, args, { encoding: "utf8" });
      return { status: r.status, stdout: r.stdout ?? "" };
    }),
  );
  results.push(checkDepsInstalled(existsSync, ROOT));
  results.push(checkDbWritable(env.DATABASE_URL, ROOT));
  results.push(...(await checkPorts(env, probePort)));

  console.log("== tarima doctor ==\n");
  console.log("checks:");
  for (const r of results) {
    console.log(`  ${r.ok ? "ok  " : "FAIL"} ${r.name} — ${r.detail}`);
    if (r.blocker && !r.ok) blockers.push(r.detail);
  }

  console.log("\nenv vars (names only — values are never printed):");
  const rows = envReport(env);
  const missingRecommended = rows.filter((r) => r.state === "missing" && r.recommended);
  for (const r of rows) {
    console.log(`  ${r.state === "set" ? "set    " : "miss   "} ${r.name} — ${r.need}`);
  }
  if (missingRecommended.length > 0) {
    console.log(
      `\n  ${missingRecommended.length} recommended var(s) unset (fine for stub-LLM dev; needed for the real thing).`,
    );
  }

  console.log("\nproviders:");
  const cauce = await probeCauce(env.CAUCE_BASE_URL);
  for (const p of providerReport(env, cauce)) {
    console.log(`  ${STATE_MARK[p.state]} ${p.name} — ${p.detail}`);
  }

  if (blockers.length > 0) {
    console.log(`\ndoctor: ${blockers.length} blocker(s)`);
    return 1;
  }
  console.log("\ndoctor: no blockers");
  return 0;
}

const invokedAs = process.argv[1]
  ? fileURLToPath(import.meta.url) === resolve(process.argv[1])
  : false;
if (invokedAs) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      console.error("doctor: unexpected failure:", err);
      process.exit(1);
    },
  );
}
