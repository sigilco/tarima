/**
 * tarima runtime: mounts the framework-agnostic api handlers onto a
 * TanStack Start server, boots the workflow engine and serves the
 * built web app from one process (nitro node-server preset).
 *
 * The handlers in `lib/api-handlers` are plain (Request => Response)
 * functions; this file is the only place that knows about the router
 * plumbing. `registerApiRuntime` runs before the server accepts
 * traffic, so no request can race the boot.
 */
import handler from "@tanstack/react-start/server-entry";
import { buildApiHandlers } from "./lib/api-handlers";
import { registerApiRuntime, runtimeNotReadyResponse } from "./lib/api-handlers/runtime";
import { startEngine } from "@tarima/api/engine";
import { setVenueSearchDeps } from "@tarima/api/services/venue-search";
import { defaultProviders } from "@tarima/venuesearch/providers";
import { startTelegram } from "@tarima/api/telegram";
import { mountEveRuntime } from "../agent/runtime";
import { setEveOrigin } from "./lib/api-handlers/agent-runtime-state";

const apiFetch = buildApiHandlers();

registerApiRuntime({
  fetch: apiFetch,
  startEngine: () => {
    startEngine();
  },
});

// The engine (step runner + outbox pump) starts before the server
// listens: a triggered workflow must find a worker already claiming
// steps, and a crash-recovery sweep runs before the first claim.
void Promise.resolve(startEngine()).catch((err) =>
  console.error("[server] engine boot failed", err),
);

// The venue provider chain (stream F): curation falls back to a live
// search when the catalog has nothing for the city. The providers are
// the public, keyless ones (Photon discovery, Overpass enrichment).
setVenueSearchDeps(defaultProviders());

// The Telegram bot is optional: without TELEGRAM_BOT_TOKEN this is a
// no-op, so dev and CI boot the api without a bot.
startTelegram().catch((err) => console.error("[telegram] boot failed", err));

// The eve agent runtime (agent/, channels, tools, workflow world) runs
// in this process behind a loopback socket; /api/agent/turn reaches it
// through eve's own HTTP channel with the caller's session cookie.
void mountEveRuntime().then((origin) => setEveOrigin(origin));

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
