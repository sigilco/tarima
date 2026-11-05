/**
 * Mock Meta Graph API for WhatsApp Cloud (SP6-B): the outbound send
 * endpoint `POST /<version>/<phoneNumberId>/messages` that
 * packages/channels/src/providers/whatsapp.ts calls, plus helpers that
 * build the inbound webhook payload the adapter parses
 * (`entry[].changes[].value.messages[]`) and sign it with the exact
 * HMAC scheme `verifyWebhook` checks (`x-hub-signature-256: sha256=<hex>`
 * over the raw body with the app secret).
 *
 * Dependency-free (node:http). Start on an ephemeral port with
 * `startMockWhatsapp()`; the returned handle records every outbound
 * message in `sent` and exposes `inboundPayload()` / `inboundHeaders()`.
 */
import { createHmac } from "node:crypto";
import { createServer } from "node:http";

export function startMockWhatsapp({ port = 0, appSecret = "mock-wa-app-secret" } = {}) {
  /** Every outbound message: { to, text, raw, at }. */
  const sent = [];

  const server = createServer((req, res) => {
    const reply = (status, payload) => {
      res.statusCode = status;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(payload));
    };
    // POST /<version>/<phoneNumberId>/messages
    const match = /^\/(v[\d.]+)\/(\d+)\/messages$/.exec(req.url ?? "");
    if (req.method !== "POST" || !match) {
      reply(404, { error: { message: `unknown route ${req.url}` } });
      return;
    }
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      let parsed = {};
      try {
        parsed = JSON.parse(body || "{}");
      } catch {
        parsed = {};
      }
      const record = {
        to: parsed.to ?? "",
        text: parsed.text?.body ?? "",
        raw: parsed,
        at: Date.now(),
      };
      sent.push(record);
      reply(200, {
        messaging_product: "whatsapp",
        contacts: [{ input: record.to, wa_id: record.to }],
        messages: [{ id: `wamid.mock-${sent.length}` }],
      });
    });
  });

  return {
    appSecret,
    sent,
    server,
    async start() {
      await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
      const address = server.address();
      const actual = typeof address === "object" && address ? address.port : port;
      return { port: actual, baseUrl: `http://127.0.0.1:${actual}` };
    },
    stop() {
      return new Promise((resolve) => server.close(resolve));
    },
    /**
     * The webhook payload shape packages/channels/src/providers/
     * whatsapp.ts parses: entry[].changes[].value.messages[] with
     * from/id/timestamp/type/text.body.
     */
    /**
     * @param {{ from: string, text: string, id?: string, timestamp?: string }} input
     */
    inboundPayload({ from, text, id, timestamp }) {
      return {
        object: "whatsapp_business_account",
        entry: [
          {
            id: "mock-entry",
            changes: [
              {
                field: "messages",
                value: {
                  messaging_product: "whatsapp",
                  metadata: { display_phone_number: "1555000111", phone_number_id: "123456789" },
                  contacts: [{ profile: { name: "QA" }, wa_id: from }],
                  messages: [
                    {
                      from,
                      id: id ?? `wamid.in-${Date.now()}`,
                      timestamp: timestamp ?? String(Math.floor(Date.now() / 1000)),
                      type: "text",
                      text: { body: text },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };
    },
    /**
     * The exact signature header verifyWebhook checks: HMAC-SHA256 of the
     * raw body with the app secret, hex, prefixed `sha256=`.
     */
    inboundHeaders(rawBody) {
      const hex = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
      return {
        "content-type": "application/json",
        "x-hub-signature-256": `sha256=${hex}`,
      };
    },
  };
}
