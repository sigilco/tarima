/**
 * Unit tests for the repo tooling in scripts/:
 *   - env-audit.ts: env-var extraction + .env.example coverage
 *   - doctor.ts:    the pure environment/provider checks behind `mise run doctor`
 *
 * The repo-scan test is the gate for the ".env.example audit" deliverable:
 * it fails when first-party code reads an env var that is neither listed
 * (commented or active) in .env.example nor on the platform allowlist.
 */
import {
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  checkDbWritable,
  checkDepsInstalled,
  checkNodeVersion,
  checkPnpm,
  checkPorts,
  envReport,
  providerReport,
  resolveDbPath,
  ENV_SPEC,
} from "../../../../scripts/doctor";
import {
  collectEnvVars,
  ENV_AUDIT_ALLOWLIST,
  extractEnvVars,
  parseEnvExample,
  undocumentedVars,
  type SourceFile,
} from "../../../../scripts/env-audit";

const ROOT = resolve(import.meta.dirname, "../../../..");

// ---------------------------------------------------------------------------
// env-audit: extraction patterns
// ---------------------------------------------------------------------------

describe("extractEnvVars", () => {
  it("covers every first-party access pattern", () => {
    const src = [
      'const a = process.env.DATABASE_URL ?? "x";',
      "const b = import.meta.env.VITE_API_ORIGIN;",
      'const c = process.env["WHATSAPP_TOKEN"];',
      'const KEY = "DEV_LOGIN"; const d = process.env[KEY];',
      "const env = deps.env ?? process.env; const e = env.FSQ_API_KEY;",
      'const f = getEnv("LOG_SINK");',
      'const g = envInt(env, "FSQ_PLACES_DAILY_BUDGET", 16);',
      'process.env.WRITTEN_ONLY = "x"; // writes are not reads',
      'const h = process.env.NODE_ENV === "production";',
    ].join("\n");
    const names = extractEnvVars(src);
    for (const expected of [
      "DATABASE_URL",
      "VITE_API_ORIGIN",
      "WHATSAPP_TOKEN",
      "DEV_LOGIN",
      "FSQ_API_KEY",
      "LOG_SINK",
      "FSQ_PLACES_DAILY_BUDGET",
      "NODE_ENV",
    ]) {
      expect(names).toContain(expected);
    }
    expect(names).not.toContain("WRITTEN_ONLY");
  });

  it("does not truncate names on write-lookalikes", () => {
    // Regression: a failed write-lookahead used to backtrack the name by
    // one char ("DATABASE_URL" → "DATABASE_UR").
    const names = extractEnvVars(
      'process.env.DATABASE_URL = "x";\nconst y = process.env.SESSION_SECRET ?? "d";',
    );
    expect(names).toContain("SESSION_SECRET");
    expect(names).not.toContain("DATABASE_UR");
    expect(names).not.toContain("DATABASE_URL"); // pure write, not a read
  });
});

describe("parseEnvExample / undocumentedVars", () => {
  it("counts commented placeholders as documented", () => {
    const example = "# BIFROST_VK=...\nDATABASE_URL=.data/dev.db\n# plain comment\n";
    const documented = parseEnvExample(example);
    expect(documented.has("BIFROST_VK")).toBe(true);
    expect(documented.has("DATABASE_URL")).toBe(true);
    expect(documented.has("plain")).toBe(false);
  });

  it("flags vars missing from .env.example, honoring the allowlist", () => {
    // The env reads are built via a variable so the repo-scan test below
    // does not pick these synthetic names up as real usage.
    const envRef = "process.env.";
    const files: SourceFile[] = [
      { path: "a.ts", text: `const x = ${envRef}NEW_THING ?? ${envRef}CI;` },
    ];
    const missing = undocumentedVars(files, "", new Set());
    expect(missing.map((m) => m.name).sort()).toEqual(["CI", "NEW_THING"]);
    const withAllow = undocumentedVars(files, "", new Set(["CI"]));
    expect(withAllow.map((m) => m.name)).toEqual(["NEW_THING"]);
    const documented = undocumentedVars(files, "NEW_THING=1\n");
    expect(documented).toEqual([]); // CI is on the default platform allowlist
  });
});

// ---------------------------------------------------------------------------
// env-audit: the real repo scan (the .env.example gate)
// ---------------------------------------------------------------------------

const EXTS = /\.(ts|tsx|mjs|js)$/;
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".output",
  ".git",
  "paraglide",
  ".data",
  ".logs",
  "baselines",
  ".eve",
]);
// Vendored upstream (packages/eve) and the Cloudflare worker deployables
// have their own env surfaces documented in their own AGENTS.md files.
const SKIP_PREFIXES = [
  /^packages\/eve\//,
  /^apps\/inbound-worker\//,
  /^apps\/web\/public\/_worker\.js$/,
];

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (EXTS.test(entry)) yield p;
  }
}

function repoSourceFiles(): SourceFile[] {
  const files: SourceFile[] = [];
  for (const top of ["apps", "packages", "scripts"]) {
    for (const abs of walk(join(ROOT, top))) {
      const rel = abs.slice(ROOT.length + 1);
      if (SKIP_PREFIXES.some((re) => re.test(rel))) continue;
      files.push({ path: rel, text: readFileSync(abs, "utf8") });
    }
  }
  return files;
}

describe("repo env audit", () => {
  it("every env var read in first-party code is in .env.example or allowlisted", () => {
    const files = repoSourceFiles();
    expect(files.length).toBeGreaterThan(50); // sanity: the walk found the tree
    const missing = undocumentedVars(files, readFileSync(join(ROOT, ".env.example"), "utf8"));
    expect(
      missing,
      `env vars read but undocumented in .env.example:\n${missing
        .map((m) => `  ${m.name} (${m.file})`)
        .join(
          "\n",
        )}\nAdd them to .env.example with a comment, or to ENV_AUDIT_ALLOWLIST in scripts/env-audit.ts if platform-injected.`,
    ).toEqual([]);
  });

  it("the allowlist only contains platform-injected names", () => {
    // Guard against the allowlist becoming a dumping ground.
    expect(ENV_AUDIT_ALLOWLIST.size).toBeLessThanOrEqual(10);
  });
});

// ---------------------------------------------------------------------------
// doctor: pure checks
// ---------------------------------------------------------------------------

describe("doctor checks", () => {
  it("node version gate", () => {
    expect(checkNodeVersion("24.1.0").ok).toBe(true);
    expect(checkNodeVersion("24.1.0").blocker).toBe(false);
    const old = checkNodeVersion("22.11.0");
    expect(old.ok).toBe(false);
    expect(old.blocker).toBe(true);
  });

  it("pnpm presence", () => {
    const ok = checkPnpm(() => ({ status: 0, stdout: "12.16.1\n" }));
    expect(ok.ok).toBe(true);
    const missing = checkPnpm(() => ({ status: null, stdout: "" }));
    expect(missing.ok).toBe(false);
    expect(missing.blocker).toBe(true);
  });

  it("deps + db path resolution", () => {
    expect(checkDepsInstalled((p) => p.endsWith("node_modules"), "/repo").ok).toBe(true);
    expect(checkDepsInstalled(() => false, "/repo").blocker).toBe(true);
    expect(resolveDbPath(".data/dev.db", "/repo")).toBe("/repo/.data/dev.db");
    expect(resolveDbPath("/abs/x.db", "/repo")).toBe("/abs/x.db");
    expect(resolveDbPath(undefined, "/repo")).toBe("/repo/tarima.db");
  });

  it("db writable probe passes on a temp dir and fails on a file-in-the-way", () => {
    const dir = mkdtempSync(join(tmpdir(), "doctor-test-"));
    try {
      const ok = checkDbWritable(".data/dev.db", dir);
      expect(ok.ok).toBe(true);
      // A regular file where the db directory must be → not writable.
      const blocker = join(dir, "blocked");
      writeFileSync(blocker, "x");
      const bad = checkDbWritable(join("blocked", "dev.db"), dir);
      expect(bad.ok).toBe(false);
      expect(bad.blocker).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("ports: busy is a blocker, free is fine", async () => {
    const rows = await checkPorts({}, async (port) => (port === 3000 ? "busy" : "free"));
    const web = rows.find((r) => r.name.includes("3000"));
    expect(web?.ok).toBe(false);
    expect(web?.blocker).toBe(true);
    expect(rows.filter((r) => r.ok)).toHaveLength(4);
    // Env override is honored.
    const custom = await checkPorts({ WEB_PORT: "3999" }, async () => "free");
    expect(custom[0]?.name).toContain("3999");
  });
});

describe("doctor provider classification", () => {
  it("stub LLM is replay even with a key; key without stub is live", () => {
    expect(providerReport({ TARIMA_AGENT_STUB: "1", BIFROST_VK: "k" })[0]).toMatchObject({
      name: "llm",
      state: "replay",
    });
    expect(providerReport({ BIFROST_VK: "k" })[0]).toMatchObject({ name: "llm", state: "live" });
    expect(providerReport({})[0]).toMatchObject({ name: "llm", state: "replay" });
  });

  it("mail: loopback mock beats the Brevo key; key alone is live", () => {
    const mock = providerReport({ MAIL_API_BASE_URL: "http://127.0.0.1:3513", BREVO_API_KEY: "k" });
    expect(mock.find((r) => r.name === "mail-out")?.state).toBe("replay");
    const live = providerReport({ BREVO_API_KEY: "k" });
    expect(live.find((r) => r.name === "mail-out")?.state).toBe("live");
    const noop = providerReport({});
    expect(noop.find((r) => r.name === "mail-out")?.state).toBe("off");
  });

  it("whatsapp agent channel: mock base URL is replay, creds are live, defaults are off", () => {
    const mock = providerReport({ WHATSAPP_API_BASE_URL: "http://127.0.0.1:3512" });
    expect(mock.find((r) => r.name === "whatsapp-agent")?.state).toBe("replay");
    const live = providerReport({
      WHATSAPP_ACCESS_TOKEN: "t",
      WHATSAPP_PHONE_NUMBER_ID: "1",
      WHATSAPP_APP_SECRET: "s",
      WHATSAPP_VERIFY_TOKEN: "v",
    });
    expect(live.find((r) => r.name === "whatsapp-agent")?.state).toBe("live");
    const none = providerReport({});
    expect(none.find((r) => r.name === "whatsapp-agent")?.state).toBe("off");
  });

  it("google places ships off; fsq and cauce follow their keys/probe", () => {
    const off = providerReport({});
    expect(off.find((r) => r.name === "google-places")?.state).toBe("off");
    expect(off.find((r) => r.name === "foursquare")?.state).toBe("off");
    const on = providerReport({
      GOOGLE_PLACES_ENABLED: "1",
      GOOGLE_MAPS_API_KEY: "k",
      FSQ_API_KEY: "f",
    });
    expect(on.find((r) => r.name === "google-places")?.state).toBe("live");
    expect(on.find((r) => r.name === "foursquare")?.state).toBe("live");
    // cauce: unreachable probe → off; reachable → live; unprobed default → unknown.
    expect(providerReport({}, false).find((r) => r.name === "cauce")?.state).toBe("off");
    expect(providerReport({}, true).find((r) => r.name === "cauce")?.state).toBe("live");
    expect(providerReport({}).find((r) => r.name === "cauce")?.state).toBe("unknown");
  });

  it("envReport marks set vs missing without values", () => {
    const rows = envReport({ DATABASE_URL: ".data/x.db" });
    const db = rows.find((r) => r.name === "DATABASE_URL");
    expect(db?.state).toBe("set");
    expect(JSON.stringify(rows)).not.toContain(".data/x.db"); // values never leak
    expect(rows.filter((r) => r.state === "missing").length).toBe(ENV_SPEC.length - 1);
    expect(envReport({}).every((r) => r.state === "missing")).toBe(true);
  });
});
