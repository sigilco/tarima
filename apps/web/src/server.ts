/**
 * tarima runtime: mounts the framework-agnostic api handlers onto a
 * TanStack Start server and serves the built web app from one process
 * (nitro node-server preset).
 *
 * The handlers in `lib/api-handlers` are plain (Request => Response)
 * functions; this file is the only place that knows about the router
 * plumbing. `registerApiRuntime` runs before the server accepts
 * traffic, so no request can race the boot.
 *
 * SP7 teardown: the workflow engine boot, the venue provider chain and
 * the legacy Telegram bot are gone (the engine, venuesearch and
 * telegram packages are removed). The eve agent runtime still mounts
 * in-process; its Telegram channel lives in `agent/channels/telegram.ts`.
 */
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import handler from "@tanstack/react-start/server-entry";
import { buildApiHandlers } from "./lib/api-handlers";
import { runtimeNotReadyResponse } from "./lib/api-handlers/runtime";
import { mountEveRuntime } from "../agent/runtime";
import { trackEveMount } from "./lib/api-handlers/agent-runtime-state";

const apiFetch = buildApiHandlers();

// Nitro's public-assets reader resolves each asset path (stored relative
// to the nitro output.serverDir) against dirname(__nitro_main__). The
// built bundle sets that global in its entry prepend, but under `vite
// dev` nothing does until the eve .output import below overwrites it —
// and with no dist/ the asset manifest is empty so the bug stays hidden.
// Once `pnpm build` has produced dist/, the dev manifest lists
// dist/client/* and readAsset resolves them against the eve bundle's
// .output/server, escaping to apps/dist/client -> ENOENT on every
// asset (GET / included). Point the global at the nitro dev serverDir
// (node_modules/.nitro/dev) so paths land back on apps/web/dist/client.
// In the built/preview bundle __nitro_main__ is already correct, so
// this only fires in dev.
if (!globalThis.__nitro_main__) {
  globalThis.__nitro_main__ = pathToFileURL(
    join(process.cwd(), "node_modules", ".nitro", "dev", "index.mjs"),
  ).href;
}

// The eve agent runtime (agent/, channels, tools) runs in this process
// behind a loopback socket; /api/agent/turn and /api/eve/* reach it
// through eve's own HTTP channel with the caller's session cookie.
trackEveMount(mountEveRuntime());

/** True for the API-only prefixes (json in, json out; no html shell). */
function isApiRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/webhooks/") ||
    pathname.startsWith("/internal/") ||
    pathname === "/api" ||
    pathname === "/mcp" ||
    pathname === "/capabilities"
  );
}

export default {
  fetch(req: Request): Promise<Response> {
    if (isApiRoute(new URL(req.url).pathname)) {
      if (!apiFetch) return Promise.resolve(runtimeNotReadyResponse());
      return apiFetch(req);
    }
    return Promise.resolve(handler.fetch(req));
  },
};
