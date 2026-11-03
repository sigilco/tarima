/**
 * Node entry for the unified tarima runtime: Hono API routes plus the
 * TanStack Start SSR build (static assets served by Caddy in production;
 * this handler only renders the app shell).
 */
import { serve } from "@hono/node-server";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { startEngine } from "./engine";
import { setVenueSearchDeps } from "./services/venue-search";
import { defaultProviders } from "@tarima/venuesearch/providers";
import { accessRequestRoutes } from "./routes/access-requests";
import { apiKeyRoutes } from "./routes/api-keys";
import { authRoutes } from "./routes/auth";
import { capabilityRoutes } from "./routes/capabilities";
import { csvRoutes } from "./routes/csv";
import { entityRoutes } from "./routes/entities";
import { eventRoutes } from "./routes/events";
import { mcpRoutes } from "./routes/mcp";
import { projectRoutes } from "./routes/projects";
import { roomRoutes } from "./routes/room";
import { settingsRoutes } from "./routes/settings";
import { uiRoutes } from "./routes/ui";
import { webhookRoutes } from "./routes/webhooks";
import { workflowRoutes } from "./routes/workflows";
import { startTelegram } from "./telegram";

const here = dirname(fileURLToPath(import.meta.url));

let ssrFetch: ((req: Request) => Promise<Response>) | undefined;
const WEB_SSR = join(here, "./web/ssr/server.js");
try {
  const mod = await import(WEB_SSR);
  ssrFetch = mod.default.fetch ?? mod.default;
} catch {
  console.warn("[server] web SSR build not found, API-only mode");
}

const app = new Hono();

app.use("/api/*", cors({ origin: "*" }));

app.get("/api/health", (c) => c.json({ ok: true }));

app.route("/", accessRequestRoutes);

// Inbound webhooks (Cloudflare email worker, Meta WhatsApp). These are
// secret-authed, not bearer-authed, and must be mounted before the
// catch-all SSR handler below.
app.route("/", webhookRoutes);

app.route("/", authRoutes);
app.route("/", apiKeyRoutes);
app.route("/", projectRoutes);
app.route("/", entityRoutes);
app.route("/", workflowRoutes);
app.route("/", csvRoutes);
app.route("/", mcpRoutes);
app.route("/", capabilityRoutes);
app.route("/", roomRoutes);
app.route("/", eventRoutes);
app.route("/", uiRoutes);
app.route("/", settingsRoutes);

// Static client assets (vite build output) and the SSR handler for
// everything else. In production both live inside the artifact next to
// this file; the ssr bundle references /assets/* which must resolve here
// because Caddy proxies the whole site to this process.
const WEB_CLIENT = join(here, "./web/client");
app.use("/assets/*", serveStatic({ root: join(WEB_CLIENT) }));
app.get("/mark.png", serveStatic({ path: join(WEB_CLIENT, "mark.png") }));
app.get("/favicon.ico", serveStatic({ path: join(WEB_CLIENT, "favicon.ico") }));

// TanStack Start SSR for everything that is not /api/*.
app.all("*", async (c) => {
  if (!ssrFetch) return c.text("web build missing", 503);
  return ssrFetch(c.req.raw);
});

const port = Number(process.env.PORT ?? 3001);

// The engine (step runner + outbox pump) starts before the server
// listens: a triggered workflow must find a worker already claiming
// steps, and a crash-recovery sweep runs before the first claim.
startEngine();

// The venue provider chain (stream F): curation falls back to a live
// search when the catalog has nothing for the city. The providers are
// the public, keyless ones (Photon discovery, Overpass enrichment).
setVenueSearchDeps(defaultProviders());

serve({ fetch: app.fetch, port, hostname: "127.0.0.1" }, (info) => {
  console.log(`tarima listening on :${info.port}`);
});

// The Telegram bot is optional: without TELEGRAM_BOT_TOKEN this is a
// no-op, so dev and CI boot the api without a bot.
startTelegram().catch((err) => console.error("[telegram] boot failed", err));

export default app;
