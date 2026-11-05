/**
 * Mounts the compiled eve agent runtime in the web process.
 *
 * eve's supported deployment unit is the Nitro node-server output that
 * `eve build` produces under `.output/` — there is no public in-process
 * handler export (see packages/eve/dist/src/internal/nitro/host). To keep
 * ONE process (the app must not fork a separate service), the built
 * server module is imported in-process: it opens a second, loopback-only
 * socket (srvx `serve`, NITRO_PORT 0 -> ephemeral, NITRO_HOST 127.0.0.1),
 * and the workflow local-world callback origin points at it. Requests to
 * the agent go through eve's own HTTP channel (`/eve/v1/*`), which is
 * where the tarima session-cookie auth in `agent/channels/eve.ts` runs.
 *
 * Build steps (not part of `vite build`): `pnpm --filter web exec node
 * node_modules/eve/bin/eve.js build --skip-sandbox-prewarm`.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const APP_ROOT = process.cwd();
const EVE_SERVER_ENTRY = join(APP_ROOT, ".output", "server", "index.mjs");
const EVE_ORIGIN_ENV = "TARIMA_EVE_ORIGIN";
const EVE_BUILD_FLAG = "TARIMA_EVE_BUILD";

/** Builds the eve runtime if its output is missing; returns success. */
function ensureEveBuild(): boolean {
  if (existsSync(EVE_SERVER_ENTRY)) return true;
  if (process.env[EVE_BUILD_FLAG] === "0") return false;
  console.log("[eve-runtime] building eve agent output (.output/)");
  const result = spawnSync(
    process.execPath,
    [join(APP_ROOT, "node_modules", "eve", "bin", "eve.js"), "build", "--skip-sandbox-prewarm"],
    { cwd: APP_ROOT, stdio: "inherit" },
  );
  return result.status === 0 && existsSync(EVE_SERVER_ENTRY);
}

/**
 * The loopback origin the compiled eve runtime serves, or undefined when
 * the runtime is not mounted (no build, or mount disabled).
 *
 * Importing the built server entry starts its listener synchronously
 * enough: srvx `serve` binds before the awaited default export resolves.
 * The workflow local-world callbacks are pointed at the same origin so
 * queued-turn deliveries reach the runtime in this process.
 */
export async function mountEveRuntime(): Promise<string | undefined> {
  const external = process.env[EVE_ORIGIN_ENV];
  if (external) {
    // An eve runtime already serving elsewhere (dev convenience); no
    // in-process mount, point the client at it.
    return external;
  }
  if (!ensureEveBuild()) {
    console.warn(
      "[eve-runtime] no eve build output; agent unavailable. Run: node node_modules/eve/bin/eve.js build --skip-sandbox-prewarm",
    );
    return undefined;
  }
  // The listener binds inside the module's top-level await, before the
  // import() promise resolves, so by the time we get the URL the socket
  // accepts /eve/v1/health.
  const port = process.env.TARIMA_EVE_PORT ?? "4310";
  process.env.NITRO_HOST = "127.0.0.1";
  process.env.NITRO_PORT = port;
  await import(EVE_SERVER_ENTRY).catch((err) => {
    console.error("[eve-runtime] eve server import failed", err);
    return undefined;
  });
  return `http://127.0.0.1:${port}`;
}
