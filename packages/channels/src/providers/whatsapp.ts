import { createHmac, timingSafeEqual } from "node:crypto";
import { cachedRequestBody, readRawBody } from "../body";
import type { ChannelAdapter, InboundMessage, OutboundMessage, SendResult } from "../types";

export interface WhatsappAdapter extends ChannelAdapter {
  /**
   * The raw body is optional: pass it when the caller already read it, or
   * rely on the cached body from `readRawBody`/`parseInbound`.
   */
  verifyWebhook(req: Request, rawBody?: string): boolean;
}

export interface WhatsappAdapterConfig {
  /** System-user or temp access token. Defaults to WHATSAPP_TOKEN. */
  token?: string;
  /** Phone number id from the Meta API Setup page. Defaults to WHATSAPP_PHONE_NUMBER_ID. */
  phoneNumberId?: string;
  /** App Secret from App Settings, used for the webhook HMAC. Defaults to WHATSAPP_APP_SECRET. */
  appSecret?: string;
  /** Graph API version. */
  apiVersion?: string;
  /** Injectable for tests. Defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

/** Shape of the Graph API inbound messages webhook payload. */
interface WhatsappWebhookPayload {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from?: string;
          id?: string;
          timestamp?: string;
          type?: string;
          text?: { body?: string };
        }>;
      };
    }>;
  }>;
}

const DEFAULT_API_VERSION = "v21.0";

/**
 * Constant-time hex compare that tolerates length differences and bad input.
 */
function safeHexEqual(actual: string, expected: string): boolean {
  if (!/^[0-9a-f]+$/i.test(actual) || actual.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(actual, "utf8"), Buffer.from(expected, "utf8"));
}

/** Extract the first inbound text message from a webhook payload. */
function extractInboundMessage(
  payload: WhatsappWebhookPayload,
): { from: string; id: string; timestamp?: string; text: string } | null {
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const message of change.value?.messages ?? []) {
        if (!message.from) continue;
        return {
          from: message.from,
          id: message.id ?? "",
          timestamp: message.timestamp,
          text: message.text?.body ?? "",
        };
      }
    }
  }
  return null;
}

/**
 * GET /webhooks/whatsapp challenge. Meta calls it once when the webhook is
 * saved. Returns the challenge string to echo back, or null when the request
 * is not a valid subscribe confirmation.
 */
export function verifyWhatsappChallenge(url: URL, verifyToken?: string): string | null {
  const expected = verifyToken ?? process.env.WHATSAPP_VERIFY_TOKEN ?? "";
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode !== "subscribe" || token === null || challenge === null) return null;
  return token === expected ? challenge : null;
}

/**
 * WhatsApp Cloud API adapter. Outbound is one Graph API fetch; inbound is
 * the messages webhook payload (signature + parsing only, route wiring
 * belongs to the api app).
 */
export function createWhatsappAdapter(config: WhatsappAdapterConfig = {}): WhatsappAdapter {
  const version = config.apiVersion ?? DEFAULT_API_VERSION;
  const doFetch = config.fetchImpl ?? fetch;
  const token = config.token ?? process.env.WHATSAPP_TOKEN;
  const phoneNumberId = config.phoneNumberId ?? process.env.WHATSAPP_PHONE_NUMBER_ID;
  const appSecret = config.appSecret ?? process.env.WHATSAPP_APP_SECRET;

  return {
    id: "whatsapp",

    async send(msg: OutboundMessage): Promise<SendResult> {
      if (!token || !phoneNumberId) {
        return {
          externalId: "",
          provider: "whatsapp",
          accepted: false,
          reason: "WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not configured",
        };
      }
      const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
      const res = await doFetch(url, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: msg.to,
          type: "text",
          text: { body: msg.text },
        }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        return {
          externalId: "",
          provider: "whatsapp",
          accepted: false,
          reason: `whatsapp send failed: ${res.status}${detail ? ` ${detail}` : ""}`,
        };
      }
      const payload = (await res.json().catch(() => null)) as {
        messages?: Array<{ id?: string }>;
      } | null;
      return {
        externalId: payload?.messages?.[0]?.id ?? "",
        provider: "whatsapp",
        accepted: true,
      };
    },

    verifyWebhook(req: Request, rawBody?: string): boolean {
      if (!appSecret) return false;
      const sig = req.headers.get("x-hub-signature-256") ?? "";
      const prefix = "sha256=";
      if (!sig.startsWith(prefix)) return false;
      const body = rawBody ?? cachedRequestBody(req) ?? "";
      const expected = createHmac("sha256", appSecret).update(body).digest("hex");
      return safeHexEqual(sig.slice(prefix.length), expected);
    },

    async parseInbound(req: Request): Promise<InboundMessage | null> {
      const raw = await readRawBody(req);
      if (!raw.trim()) return null;
      let payload: WhatsappWebhookPayload;
      try {
        payload = JSON.parse(raw) as WhatsappWebhookPayload;
      } catch {
        return null;
      }
      const message = extractInboundMessage(payload);
      if (!message) return null;
      return {
        channel: "whatsapp",
        threadId: message.from,
        from: message.from,
        text: message.text,
        raw: payload,
      };
    },
  };
}
