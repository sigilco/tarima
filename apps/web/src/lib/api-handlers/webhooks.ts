/**
 * Inbound webhook handlers (email + WhatsApp).
 *
 * Ported from apps/api/src/routes/webhooks.ts: the same contracts and
 * the same entity resolution, as plain (Request => Response) functions
 * instead of Hono routes.
 *
 *   POST /webhooks/email
 *     header: `X-Webhook-Secret: <INBOUND_WEBHOOK_SECRET>`
 *     body:   either `{raw: string, to?: string, from?: string}` (what
 *             the Cloudflare Email Worker sends) or the raw MIME text
 *             itself.
 *
 *   GET /webhooks/whatsapp
 *     Meta's one-time verification: echoes the challenge when the
 *     verify token matches `WHATSAPP_VERIFY_TOKEN`, else 403.
 *
 *   POST /webhooks/whatsapp
 *     header: `X-Hub-Signature-256: sha256=<hmac of the raw body>`
 *     body:   the Meta messages webhook JSON.
 *
 * These routes are secret-authed, not bearer-authed: Cloudflare and
 * Meta cannot present an api key.
 */
import { randomUUID } from "node:crypto";
import { parseMime, readRawBody, verifyWhatsappChallenge } from "@tarima/channels";
import { emailAdapter, whatsappAdapter } from "@tarima/api/channels";
import { db } from "@tarima/api/db";
import { outreachMessages } from "@tarima/api/db/schema";
import { enqueueParseStep, findActiveRunForContact } from "@tarima/api/services/runs";
import { bindChannel } from "@tarima/api/services/bindings";
import { resolveConnectCode } from "@tarima/api/services/connect-codes";

/** What the route records for an inbound message. */
interface InboundRecord {
  channel: "email" | "whatsapp";
  from: string;
  to: string;
  subject?: string;
  body: string;
  threadId: string;
}

/**
 * Store the inbound message and hand it to the engine.
 *
 * The `outreach_messages` row is written when the message can be
 * attached to a run that carries an entity. An unassigned message has
 * no entity to hang on (the column is NOT NULL with a foreign key), so
 * it is only logged.
 */
function recordInbound(record: InboundRecord): { assigned: boolean } {
  const run = findActiveRunForContact(db, {
    channel: record.channel,
    threadId: record.threadId,
    from: record.from,
  });

  if (!run?.entityId) {
    console.warn(
      `[webhooks] ${record.channel} message from ${record.from} is unassigned (no running run matched)`,
    );
    return { assigned: false };
  }

  db.insert(outreachMessages)
    .values({
      id: randomUUID(),
      entityId: run.entityId,
      direction: "inbound",
      subject: record.subject ?? null,
      body: record.body,
      receivedAt: Date.now(),
    })
    .run();

  enqueueParseStep(db, run.runId, record.body);
  return { assigned: true };
}

/** The body the worker posts: JSON with a raw MIME payload. */
function readEmailPayload(raw: string): { raw: string; to?: string; from?: string } {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as {
        raw?: unknown;
        to?: unknown;
        from?: unknown;
      };
      if (typeof parsed.raw === "string") {
        return {
          raw: parsed.raw,
          to: typeof parsed.to === "string" ? parsed.to : undefined,
          from: typeof parsed.from === "string" ? parsed.from : undefined,
        };
      }
    } catch {
      // Not JSON: fall through and treat the body as raw MIME.
    }
  }
  return { raw };
}

/** POST /webhooks/email — the Cloudflare email worker contract. */
export async function handleEmailWebhook(request: Request): Promise<Response> {
  if (!emailAdapter().verifyWebhook(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const raw = await readRawBody(request);
  const payload = readEmailPayload(raw);
  const parsed = await parseMime(payload.raw);
  const body = parsed.text ?? parsed.html ?? "";

  recordInbound({
    channel: "email",
    from: payload.from ?? parsed.from,
    to: payload.to ?? parsed.to,
    subject: parsed.subject,
    body,
    threadId: payload.to ?? parsed.threadId,
  });

  return Response.json({ ok: true });
}

/** GET /webhooks/whatsapp — Meta's one-time verification. */
export function handleWhatsappVerify(request: Request): Response {
  const challenge = verifyWhatsappChallenge(new URL(request.url));
  if (!challenge) return new Response("forbidden", { status: 403 });
  return new Response(challenge);
}

/** POST /webhooks/whatsapp — the Meta messages webhook. */
export async function handleWhatsappWebhook(request: Request): Promise<Response> {
  const raw = await readRawBody(request);
  if (!whatsappAdapter().verifyWebhook(request, raw)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const inbound = await whatsappAdapter().parseInbound(request);
  if (!inbound) return Response.json({ ok: true });

  // The connect flow: the tester messages the number with the code the
  // settings page showed. The message binds the number and is answered
  // in-chat. This also opens the 24h customer service window, which is
  // what lets the notify fanout send free-form text afterwards.
  const connected = connectFromMessage("whatsapp", inbound.from, inbound.text ?? "");
  if (connected) {
    await confirmWhatsappBinding(inbound.from, connected);
    return Response.json({ ok: true });
  }

  recordInbound({
    channel: "whatsapp",
    from: inbound.from,
    to: inbound.threadId,
    subject: inbound.subject,
    body: inbound.text ?? "",
    threadId: inbound.threadId,
  });

  return Response.json({ ok: true });
}

/**
 * The connect flow for an inbound chat message: the tester sends the
 * code the settings page showed (as the whole message or as the first
 * word). Returns the confirmation text when the code resolved, and null
 * when the message was not a connect attempt.
 */
function connectFromMessage(
  channel: "telegram" | "whatsapp",
  externalId: string,
  text: string,
): string | null {
  const candidate = text.trim().split(/\s+/)[0] ?? "";
  if (!/^[A-Za-z0-9]{6}$/.test(candidate)) return null;

  const resolved = resolveConnectCode(db, channel, candidate);
  if (!resolved.ok) return null;

  bindChannel(db, { userId: resolved.userId, channel, externalId });
  return "Connected. This number now gets your Tarima notifications.";
}

/**
 * Confirm a WhatsApp binding in the chat. The confirmation is a normal
 * message, which the Cloud API only accepts inside the 24h window that
 * the tester's own message just opened.
 */
async function confirmWhatsappBinding(to: string, text: string): Promise<void> {
  try {
    const result = await whatsappAdapter().send({
      channel: "whatsapp",
      to,
      text,
    });
    if (!result.accepted) {
      console.warn("[webhooks] whatsapp binding confirmation refused:", result.reason);
    }
  } catch (error) {
    console.error("[webhooks] whatsapp binding confirmation failed", error);
  }
}
