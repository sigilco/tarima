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
import { db } from "./db";
import { accessRequests } from "./db/schema";
import { startEngine } from "./engine";
import { sendMail } from "./mail";
import { apiKeyRoutes } from "./routes/api-keys";
import { authRoutes } from "./routes/auth";
import { capabilityRoutes } from "./routes/capabilities";
import { csvRoutes } from "./routes/csv";
import { entityRoutes } from "./routes/entities";
import { eventRoutes } from "./routes/events";
import { mcpRoutes } from "./routes/mcp";
import { projectRoutes } from "./routes/projects";
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const app = new Hono();

app.use("/api/*", cors({ origin: "*" }));

app.get("/api/health", (c) => c.json({ ok: true }));

app.post("/api/access-requests", async (c) => {
  let body: { email?: unknown; intent?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_body" }, 400);
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) {
    return c.json({ error: "invalid_email" }, 400);
  }
  const intent = typeof body.intent === "string" ? body.intent.slice(0, 500) : null;

  db.insert(accessRequests).values({ email, intent }).run();

  sendMail({
    to: email,
    subject: "You are on the Tarima list",
    text: "Thanks for requesting access to Tarima. We are letting organizers in small batches — you will hear from us soon.",
  }).catch((err) => console.error("[mail] send failed", err));

  return c.json({ ok: true }, 201);
});

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
app.route("/", uiRoutes);
app.route("/", eventRoutes);

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

serve({ fetch: app.fetch, port, hostname: "127.0.0.1" }, (info) => {
  console.log(`tarima listening on :${info.port}`);
});

// The Telegram bot is optional: without TELEGRAM_BOT_TOKEN this is a
// no-op, so dev and CI boot the api without a bot.
startTelegram().catch((err) => console.error("[telegram] boot failed", err));

export default app;
