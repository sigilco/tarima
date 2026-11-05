/**
 * Access-request handler: POST /api/access-requests (public beta list).
 * Ported from apps/api/src/routes/access-requests.ts, unchanged logic.
 */
import { db } from "@tarima/api/db";
import { accessRequests } from "@tarima/api/db/schema";
import { sendMail } from "@tarima/api/mail";
import { readJson } from "./helpers";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** POST /api/access-requests — body { email, intent? }. */
export async function handleAccessRequest(request: Request): Promise<Response> {
  const body = await readJson(request);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const record = body as { email?: unknown; intent?: unknown };
  const email = typeof record.email === "string" ? record.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: "invalid_email" }, { status: 400 });
  }
  const intent = typeof record.intent === "string" ? record.intent.slice(0, 500) : null;

  db.insert(accessRequests).values({ email, intent }).run();

  sendMail({
    to: email,
    subject: "You are on the Tarima list",
    text: "Thanks for requesting access to Tarima. We are letting organizers in small batches. You will hear from us soon.",
  }).catch((err) => console.error("[mail] send failed", err));

  return Response.json({ ok: true }, { status: 201 });
}
