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

declare global {
  // Nitro's entry chunk sets this global; it is the base the runtime
  // resolves public assets against. Not typed by nitro itself.
  // eslint-disable-next-line no-var
  var __nitro_main__: string | undefined;
}

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
 * True when this process is a build (vite/nitro), not a serving server.
 *
 * The nitro build imports the server entry to prerender pages. Booting
 * the eve runtime there would start a listener inside the build process
 * (it never exits, so the build hangs for tens of minutes) and would
 * load the model provider without its API key. Only mount when a
 * server is actually serving.
 */
function isBuildProcess(): boolean {
  const argv = process.argv.join(" ");
  if (/\bvite\b[^\n]*\bbuild\b/.test(argv)) return true;
  if (/\bnitro\b[^\n]*\bbuild\b/.test(argv)) return true;
  if (process.env.NITRO_PRERENDER) return true;
  return false;
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
  // The nitro build imports this server entry to prerender pages. Booting
  // the eve runtime there would start a listener inside the build process
  // (it never exits, so the build hangs for tens of minutes) and would
  // load the model provider without its API key. Only mount when a
  // server is actually serving.
  if (isBuildProcess()) {
    console.log("[eve-runtime] build process detected; skipping the agent mount");
    return undefined;
  }
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
  // The workflow local world delivers queued turns over HTTP to this
  // origin; without it the world derives one from PORT (the web app),
  // which has no /.well-known/workflow route, and every turn stalls.
  process.env.WORKFLOW_LOCAL_BASE_URL = `http://127.0.0.1:${port}`;
  // Both nitro bundles (this app and the eve runtime) resolve their
  // public assets through the `globalThis.__nitro_main__` global, and each
  // bundle's entry OVERWRITES it on import. The eve entry is imported
  // here, after the web bundle already claimed the global, so eve's
  // `.output/server/index.mjs` would win and the web bundle's asset
  // paths (`../../client/...`) would resolve against the wrong root:
  // every /assets/* request then 500s with ENOENT.
  //
  // Restore the web bundle's value after the import. The web app is the
  // only one serving static files to browsers (eve's own public dir
  // holds just the worker shim and the og image), so the web bundle
  // must own the global.
  const webNitroMain = globalThis.__nitro_main__;
  await import(EVE_SERVER_ENTRY).catch((err) => {
    console.error("[eve-runtime] eve server import failed", err);
    return undefined;
  });
  if (webNitroMain) {
    globalThis.__nitro_main__ = webNitroMain;
  }
  return `http://127.0.0.1:${port}`;
}
