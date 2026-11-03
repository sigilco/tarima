/**
 * Reply injector: hand the chase loop an inbound email the way the
 * Cloudflare email worker would.
 *
 * The route is `POST /webhooks/email`, authenticated with the shared
 * secret in `X-Webhook-Secret`. The body is a raw MIME message, so the
 * suite exercises the same parsing path as the real worker.
 */
import { WEBHOOK_SECRET } from "./server";

/** The options of one injected reply. */
export interface ReplyOptions {
  /** The address the contact replies from. */
  from: string;
  /** The address the reply goes to (our own outreach address). */
  to: string;
  /** The body of the reply. */
  body: string;
  /** The subject of the reply. */
  subject?: string;
  /** The shared secret of the running api. */
  secret?: string;
}

/** Build a raw MIME message for a reply. */
export function buildMime(options: ReplyOptions): string {
  const subject = options.subject ?? "Re: deliverables";
  return [
    `From: ${options.from}`,
    `To: ${options.to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    options.body,
  ].join("\r\n");
}

/**
 * Post a reply to the inbound email webhook.
 *
 * Throws when the api refuses the message, so a failing suite points at
 * the injection instead of at the wait that follows.
 */
export async function injectReply(baseUrl: string, options: ReplyOptions): Promise<void> {
  const res = await fetch(`${baseUrl}/webhooks/email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Webhook-Secret": options.secret ?? WEBHOOK_SECRET,
    },
    body: JSON.stringify({
      raw: buildMime(options),
      from: options.from,
      to: options.to,
    }),
  });
  if (!res.ok) {
    throw new Error(`reply injection failed: ${res.status} ${await res.text()}`);
  }
}
