/**
 * Cloudflare Email Worker (Stage 4, T4.1b).
 *
 * Flow: illo.fyi Email Routing (CF-managed) has a catch-all rule that
 * binds this worker. Every inbound mail for the routed addresses is
 * delivered to the `email` handler below, which reads the raw MIME
 * stream and POSTs it to the api's inbound webhook. The api parses the
 * message, attaches it to the chase run it belongs to, and enqueues
 * the parse step. Reply-to disambiguation happens on the api side via
 * the `to` address.
 *
 * The `fetch` handler exists for health checks and for the CF
 * dashboard preview; it does not process mail.
 *
 * Env (wrangler):
 *   API_BASE               e.g. https://tarima.events (a vars entry)
 *   INBOUND_WEBHOOK_SECRET a wrangler secret (never in wrangler.jsonc)
 */

export interface Env {
  API_BASE?: string;
  INBOUND_WEBHOOK_SECRET?: string;
}

/** Where the raw MIME is posted. */
function webhookUrl(env: Env): string {
  const base = (env.API_BASE ?? "").replace(/\/+$/, "");
  return `${base}/webhooks/email`;
}

export default {
  /**
   * CF Email Worker entry. `message.raw` is a ReadableStream of the
   * full RFC 5322 message; `new Response(stream).text()` is the
   * documented way to buffer it.
   */
  async email(message: { from: string; to: string; raw: ReadableStream }, env: Env): Promise<void> {
    if (!env.API_BASE || !env.INBOUND_WEBHOOK_SECRET) {
      console.error("inbound-worker: API_BASE or INBOUND_WEBHOOK_SECRET is not configured");
      message.raw.cancel().catch(() => {});
      return;
    }

    // Only chase traffic is routed here (catch-all on tarima.illo.fyi);
    // anything else is dropped so a misconfigured routing rule cannot
    // leak unrelated mail into the api.
    if (!isChaseAddress(message.to)) {
      console.log(`inbound-worker: ignoring mail to ${message.to}`);
      message.raw.cancel().catch(() => {});
      return;
    }

    const raw = await new Response(message.raw).text();

    const res = await fetch(webhookUrl(env), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-webhook-secret": env.INBOUND_WEBHOOK_SECRET,
      },
      body: JSON.stringify({ raw, to: message.to, from: message.from }),
    });

    if (!res.ok) {
      // The api logs the failure with the idempotency context; the
      // worker does not retry (CF Email Workers have no redelivery).
      console.error(`inbound-worker: api webhook replied ${res.status}`);
    }
  },

  /** Health/preview surface. */
  async fetch(): Promise<Response> {
    return new Response("tarima inbound email worker\n", { status: 200 });
  },
};

/** The subdomain the chase replies land on. */
const CHASE_DOMAIN = "tarima.illo.fyi";

function isChaseAddress(to: string): boolean {
  const domain = to.trim().toLowerCase().split("@")[1];
  return domain === CHASE_DOMAIN;
}
