/**
 * Node entry for the unified tarima runtime: Hono API routes plus the
 * TanStack Start SSR build (static assets served by Caddy in production;
 * this handler only renders the app shell).
 *
 * SP7 teardown: the board/room/workflow/api-key routes, the engine boot,
 * the venue provider chain and the legacy Telegram bot are gone — the
 * in-process handlers in apps/web/src/lib/api-handlers/ are the api now.
 * This process keeps the session surface (auth, access-requests,
 * settings) and the inbound webhooks.
 */
import { serve } from "@hono/node-server";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "@hono/node-server/serve-static";
import { accessRequestRoutes } from "./routes/access-requests";
import { authRoutes } from "./routes/auth";
import { capabilityRoutes } from "./routes/capabilities";
import { mcpRoutes } from "./routes/mcp";
import { settingsRoutes } from "./routes/settings";
import { webhookRoutes } from "./routes/webhooks";

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
app.route("/", mcpRoutes);
app.route("/", capabilityRoutes);
app.route("/", settingsRoutes);

// Static client assets (vite build output) and the SSR handler for
// everything else. In production both live inside the artifact next to
// this file; the ssr bundle references /assets/* which must resolve here
// because Caddy proxies the whole site to this process.
const WEB_CLIENT = join(here, "./web/client");
app.use("/assets/*", serveStatic({ root: join(WEB_CLIENT) }));
app.get("/mark.png", serveStatic({ path: join(WEB_CLIENT, "mark.png") }));
app.get("/favicon.ico", serveStatic({ path: join(WEB_CLIENT, "favicon.ico") }));
// The social preview card: crawlers fetch it from the page origin, so the
// api (which serves the SSR site) has to serve it like mark.png.
app.get("/og-preview.png", serveStatic({ path: join(WEB_CLIENT, "og-preview.png") }));

// TanStack Start SSR for everything that is not /api/*.
app.all("*", async (c) => {
  if (!ssrFetch) return c.text("web build missing", 503);
  return ssrFetch(c.req.raw);
});

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port, hostname: "127.0.0.1" }, (info) => {
  console.log(`tarima listening on :${info.port}`);
});

export default app;
