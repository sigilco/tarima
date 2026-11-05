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
import handler from "@tanstack/react-start/server-entry";
import { buildApiHandlers } from "./lib/api-handlers";
import { runtimeNotReadyResponse } from "./lib/api-handlers/runtime";
import { mountEveRuntime } from "../agent/runtime";
import { trackEveMount } from "./lib/api-handlers/agent-runtime-state";

const apiFetch = buildApiHandlers();

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
