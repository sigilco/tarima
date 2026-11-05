/**
 * Boot the nitro server (the one-process app: ssr + api + engine) for
 * an e2e suite.
 *
 * The suite drives the server over HTTP, exactly like a browser or a
 * curl would, so the assertions cover routing, auth, the engine and the
 * channel adapters rather than a reimplementation of them.
 *
 * Everything the suite needs is configured through the environment:
 *   - a throwaway sqlite file (one per suite)
 *   - the loopback mail domain, so no outbound mail ever leaves the box
 *   - a stub LLM (no `LLM_BASE_URL`), so the chase drafts and parses
 *     deterministically
 *   - compressed engine timers, so the chase loop finishes in seconds
 *     instead of minutes
 *
 * The helper exposes the base url, the database path and the inbound
 * webhook secret, and tears everything down again in `stop()`.
 */
import { spawn, spawnSync, type ChildProcessByStdio } from "node:child_process";
import type { Readable } from "node:stream";
import { createServer } from "node:net";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { nitroServerEntry, repoRoot, webDir } from "./paths";

/** The shared secret the email webhook expects. */
export const WEBHOOK_SECRET = "e2e-inbound-secret";

/** The domain the login addresses of the suite use. */
export const LOOPBACK_DOMAIN = "tarima.test";

/**
 * The domains the outbound mail is captured in.
 *
 * Both the login domain and the contact domains are loopback, so no
 * email ever leaves the box: the outreach mail lands in the loopback
 * inbox of the contact, where the suite can read it back.
 */
export const LOOPBACK_DOMAINS = `${LOOPBACK_DOMAIN},bluenote.test,fillmore.test`;

/** A booted api process and the handles the suite needs. */
export interface ApiServer {
  /** Base url of the running api, e.g. `http://127.0.0.1:41234`. */
  baseUrl: string;
  /** Path of the sqlite file the api writes to. */
  databasePath: string;
  /** The secret to send in `X-Webhook-Secret`. */
  webhookSecret: string;
  /** Stop the process and remove the throwaway database. */
  stop: () => Promise<void>;
  /** Everything the process wrote to stdout and stderr. */
  logs: () => string;
}

/** Ask the OS for a free TCP port. */
async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address !== null ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

/** Sleep for `ms` milliseconds. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build the nitro server bundle once per suite run.
 *
 * The suite boots the production-shaped nitro server (the same artifact
 * the deploy runs), so a build is required. The build takes ~20s; it
 * runs once per suite run and the artifact is reused across every
 * `startApiServer` call in the process. A stale-but-present artifact is
 * reused as-is: `pnpm validate` builds the web app before the tests, so
 * the artifact is fresh in the gate.
 */
function ensureNitroBuild(): void {
  if (existsSync(nitroServerEntry)) return;
  const result = spawnSync("pnpm", ["-C", webDir, "build"], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0 || !existsSync(nitroServerEntry)) {
    throw new Error(
      `the nitro build failed (status ${result.status}):\n${result.stdout ?? ""}\n${result.stderr ?? ""}`,
    );
  }
}

/**
 * Boot the nitro server and wait until it answers `/api/health`.
 *
 * Throws with the captured process output when the server never comes
 * up, so a failing suite shows why.
 */
export async function startApiServer(): Promise<ApiServer> {
  ensureNitroBuild();
  const dir = mkdtempSync(join(tmpdir(), "tarima-e2e-"));
  const databasePath = join(dir, "e2e.db");
  const port = await freePort();

  const child: ChildProcessByStdio<null, Readable, Readable> = spawn(
    process.execPath,
    [nitroServerEntry],
    {
      cwd: webDir,
      env: {
        ...process.env,
        NODE_ENV: "test",
        PORT: String(port),
        DATABASE_URL: databasePath,
        SESSION_SECRET: "e2e-session-secret",
        INBOUND_WEBHOOK_SECRET: WEBHOOK_SECRET,
        EMAIL_LOOPBACK_DOMAINS: LOOPBACK_DOMAINS,
        MAIL_FROM: "outreach@tarima.test",
        // Compressed engine timers: the chase loop must finish inside the
        // test budget.
        ENGINE_STEP_POLL_MS: "50",
        ENGINE_OUTBOX_INTERVAL_MS: "50",
        // The follow-up timer must not fire during a test.
        ENGINE_FOLLOW_UP_DELAY_MS: String(60 * 60 * 1000),
        // No LLM_BASE_URL on purpose: the deterministic stub parses replies.
        LLM_BASE_URL: "",
        BREVO_API_KEY: "",
        TELEGRAM_BOT_TOKEN: "",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  let output = "";
  child.stdout.on("data", (chunk: Buffer) => {
    output += chunk.toString();
  });
  child.stderr.on("data", (chunk: Buffer) => {
    output += chunk.toString();
  });

  let exited = false;
  child.on("exit", () => {
    exited = true;
  });

  const baseUrl = `http://127.0.0.1:${port}`;

  /**
   * Poll the health endpoint until it answers.
   *
   * Recursive rather than a loop: the poll is a sequence of waits, and
   * a recursive call keeps the async flow explicit without an await
   * inside a loop body.
   */
  const pollUntilHealthy = async (deadline: number): Promise<void> => {
    if (Date.now() > deadline) {
      throw new Error(`the api process did not become healthy in time:\n${output}`);
    }
    if (exited) {
      throw new Error(`the api process exited before it became healthy:\n${output}`);
    }
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.ok) return;
    } catch {
      // Not listening yet.
    }
    await delay(100);
    await pollUntilHealthy(deadline);
  };

  try {
    await pollUntilHealthy(Date.now() + 30_000);
  } catch (err) {
    child.kill("SIGKILL");
    rmSync(dir, { recursive: true, force: true });
    throw err;
  }

  return {
    baseUrl,
    databasePath,
    webhookSecret: WEBHOOK_SECRET,
    logs: () => output,
    stop: async () => {
      if (!exited) {
        child.kill("SIGTERM");
        await waitForExit(child, 5_000);
        if (!exited) child.kill("SIGKILL");
      }
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

/**
 * Wait for a child process to exit, up to `timeoutMs`.
 *
 * Returns true when the process is gone.
 */
function waitForExit(
  child: ChildProcessByStdio<null, Readable, Readable>,
  timeoutMs: number,
): Promise<boolean> {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve(true);
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), timeoutMs);
    timer.unref?.();
    child.once("exit", () => {
      clearTimeout(timer);
      resolve(true);
    });
  });
}
