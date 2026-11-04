import { Hono } from "hono";
import { db } from "../db";
import { accessRequests } from "../db/schema";
import { sendMail } from "../mail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const accessRequestRoutes = new Hono();

accessRequestRoutes.post("/api/access-requests", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_body" }, 400);
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return c.json({ error: "invalid_body" }, 400);
  }

  const record = body as { email?: unknown; intent?: unknown };
  const email = typeof record.email === "string" ? record.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) {
    return c.json({ error: "invalid_email" }, 400);
  }
  const intent = typeof record.intent === "string" ? record.intent.slice(0, 500) : null;

  db.insert(accessRequests).values({ email, intent }).run();

  sendMail({
    to: email,
    subject: "You are on the Tarima list",
    text: "Thanks for requesting access to Tarima. We are letting organizers in small batches. You will hear from us soon.",
  }).catch((err) => console.error("[mail] send failed", err));

  return c.json({ ok: true }, 201);
});
