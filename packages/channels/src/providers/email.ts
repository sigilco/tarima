import { timingSafeEqual } from "node:crypto";
import { readRawBody } from "../body";
import { htmlToText } from "../html";
import { parseMime } from "../mime";
import type { ChannelAdapter, InboundMessage, OutboundMessage, SendResult } from "../types";

/**
 * The db seam. The api app binds this to the `loopback_inbox` table; tests
 * bind it to an array. The channels package stays db-free.
 */
export interface LoopbackSink {
  save(msg: { to: string; from?: string; subject: string; body: string; html?: string }): void;
}

/**
 * The file outbox seam. Used when no provider is configured: the message is
 * appended to a JSONL file so a dev can inspect what would have been sent.
 */
export interface FileOutbox {
  save(msg: OutboundMessage & { from?: string }): void;
}

export interface EmailAdapterConfig {
  /** Comma separated list of domains captured in the loopback inbox. */
  loopbackDomains?: string;
  /** Brevo API key. When unset, the file outbox is used. */
  brevoApiKey?: string;
  /** Sender address used for Brevo and for the loopback `from` column. */
  mailFrom?: string;
  /** Shared secret for inbound webhooks (`X-Webhook-Secret`). */
  inboundWebhookSecret?: string;
  /** Where loopback messages are written. */
  loopback?: LoopbackSink;
  /** Where messages go when no provider is configured. */
  outbox?: FileOutbox;
  /**
   * Override of the provider endpoint (`MAIL_API_BASE_URL`). When set the
   * Brevo-shaped POST goes to `<base>/v3/smtp/email` — the mock seam the
   * dev harness and tests use — regardless of whether a key is set.
   */
  mailApiBaseUrl?: string;
  /** Injectable for tests. Defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

const DEFAULT_LOOPBACK_DOMAINS = "tarima.test";
const DEFAULT_MAIL_FROM = "notifications@tarima.illo.fyi";
const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

/** The send endpoint: the env override, else Brevo. */
function sendEndpoint(baseOverride: string | undefined): { endpoint: string; overridden: boolean } {
  const base = baseOverride?.replace(/\/+$/, "");
  if (!base) return { endpoint: BREVO_ENDPOINT, overridden: false };
  return {
    endpoint: base.endsWith("/v3/smtp/email") ? base : `${base}/v3/smtp/email`,
    overridden: true,
  };
}

/** Domains whose mail never leaves the box. */
export function parseLoopbackDomains(raw: string | undefined): string[] {
  return (raw ?? DEFAULT_LOOPBACK_DOMAINS)
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
}

/** True when the recipient address belongs to a loopback domain. */
export function isLoopbackRecipient(to: string, domains: readonly string[]): boolean {
  const domain = to.trim().toLowerCase().split("@")[1];
  if (!domain) return false;
  return domains.includes(domain);
}

/** Constant-time string compare that tolerates length differences. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Email adapter. Outbound transport is picked per message:
 * loopback domains go to the db inbox, everything else goes to Brevo when a
 * key is configured and to the file outbox otherwise.
 */
export function createEmailAdapter(config: EmailAdapterConfig = {}): ChannelAdapter {
  const domains = parseLoopbackDomains(
    config.loopbackDomains ?? process.env.EMAIL_LOOPBACK_DOMAINS,
  );
  const from = config.mailFrom ?? process.env.MAIL_FROM ?? DEFAULT_MAIL_FROM;
  const brevoApiKey = config.brevoApiKey ?? process.env.BREVO_API_KEY;
  const inboundWebhookSecret = config.inboundWebhookSecret ?? process.env.INBOUND_WEBHOOK_SECRET;
  const { endpoint, overridden } = sendEndpoint(
    config.mailApiBaseUrl ?? process.env.MAIL_API_BASE_URL,
  );
  const doFetch = config.fetchImpl ?? fetch;

  return {
    id: "email",

    async send(msg: OutboundMessage): Promise<SendResult> {
      const subject = msg.subject ?? "(no subject)";
      const body = msg.text || (msg.html ? htmlToText(msg.html) : "");

      if (isLoopbackRecipient(msg.to, domains)) {
        if (!config.loopback) {
          return {
            externalId: "",
            provider: "loopback",
            accepted: false,
            reason: "no loopback sink configured",
          };
        }
        config.loopback.save({ to: msg.to, from, subject, body, html: msg.html });
        return { externalId: `loopback:${msg.to}`, provider: "loopback", accepted: true };
      }

      if (!brevoApiKey && !overridden) {
        if (!config.outbox) {
          return {
            externalId: "",
            provider: "file",
            accepted: false,
            reason: "no outbox configured and no Brevo key",
          };
        }
        config.outbox.save({ ...msg, from, subject, text: body });
        return { externalId: `file:${msg.to}`, provider: "file", accepted: true };
      }

      const res = await doFetch(endpoint, {
        method: "POST",
        headers: {
          ...(brevoApiKey ? { "api-key": brevoApiKey } : {}),
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          sender: { email: from, name: "Tarima" },
          to: [{ email: msg.to }],
          subject,
          textContent: body,
          ...(msg.html ? { htmlContent: msg.html } : {}),
          ...(msg.replyTo ? { replyTo: { email: msg.replyTo } } : {}),
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        return {
          externalId: "",
          provider: "brevo",
          accepted: false,
          reason: `brevo send failed: ${res.status}${detail ? ` ${detail}` : ""}`,
        };
      }

      const payload = (await res.json().catch(() => null)) as { messageId?: string } | null;
      return {
        externalId: payload?.messageId ?? "",
        provider: "brevo",
        accepted: true,
      };
    },

    verifyWebhook(req: Request): boolean {
      const secret = inboundWebhookSecret;
      if (!secret) return false;
      const provided = req.headers.get("x-webhook-secret") ?? "";
      return safeEqual(provided, secret);
    },

    async parseInbound(req: Request): Promise<InboundMessage | null> {
      const raw = await readRawBody(req);
      if (!raw.trim()) return null;
      const parsed = await parseMime(raw);
      if (!parsed.from) return null;
      return {
        channel: "email",
        threadId: parsed.threadId || parsed.from,
        from: parsed.from,
        subject: parsed.subject,
        text: parsed.text ?? (parsed.html ? htmlToText(parsed.html) : undefined),
        attachments: parsed.attachments,
        raw: parsed.raw,
      };
    },
  };
}
