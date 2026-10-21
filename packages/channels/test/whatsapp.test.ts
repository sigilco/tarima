import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createWhatsappAdapter, verifyWhatsappChallenge } from "../src/providers/whatsapp";
import type { OutboundMessage } from "../src/types";

const APP_SECRET = "app-secret";
const TOKEN = "wa-token";
const PHONE_ID = "1234567890";

const msg = (over: Partial<OutboundMessage> = {}): OutboundMessage => ({
  channel: "whatsapp",
  to: "+15550001111",
  text: "hello from tarima",
  ...over,
});

function stubFetch(
  status: number,
  body: unknown,
): { fetchImpl: typeof fetch; calls: Array<{ url: string; init: RequestInit }> } {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetchImpl = (async (url: string | URL, init: RequestInit) => {
    calls.push({ url: String(url), init });
    return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
  }) as typeof fetch;
  return { fetchImpl, calls };
}

describe("whatsapp adapter send", () => {
  it("posts the graph api text message with the bearer token", async () => {
    const { fetchImpl, calls } = stubFetch(200, { messages: [{ id: "wamid.1" }] });
    const adapter = createWhatsappAdapter({
      token: TOKEN,
      phoneNumberId: PHONE_ID,
      fetchImpl,
    });
    const res = await adapter.send(msg());
    expect(res).toEqual({ externalId: "wamid.1", provider: "whatsapp", accepted: true });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`);
    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers.authorization).toBe(`Bearer ${TOKEN}`);
    expect(headers["content-type"]).toBe("application/json");
    expect(calls[0]!.init.method).toBe("POST");
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual({
      messaging_product: "whatsapp",
      to: "+15550001111",
      type: "text",
      text: { body: "hello from tarima" },
    });
  });

  it("returns accepted:false with the response body on a refusal", async () => {
    const { fetchImpl } = stubFetch(400, JSON.stringify({ error: { message: "bad token" } }));
    const adapter = createWhatsappAdapter({
      token: TOKEN,
      phoneNumberId: PHONE_ID,
      fetchImpl,
    });
    const res = await adapter.send(msg());
    expect(res.accepted).toBe(false);
    expect(res.provider).toBe("whatsapp");
    expect(res.reason).toMatch(/whatsapp send failed: 400/);
    expect(res.reason).toMatch(/bad token/);
  });

  it("refuses to send when the credentials are missing", async () => {
    const adapter = createWhatsappAdapter({ token: "", phoneNumberId: "" });
    const res = await adapter.send(msg());
    expect(res.accepted).toBe(false);
    expect(res.reason).toMatch(/WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID/);
  });
});

describe("whatsapp adapter verifyWebhook", () => {
  const payload = JSON.stringify({ entry: [{ changes: [] }] });

  it("accepts a valid sha256 signature", async () => {
    const adapter = createWhatsappAdapter({ appSecret: APP_SECRET });
    const sig = `sha256=${createHmac("sha256", APP_SECRET).update(payload).digest("hex")}`;
    const req = new Request("https://api.test/webhooks/whatsapp", {
      method: "POST",
      headers: { "x-hub-signature-256": sig },
      body: payload,
    });
    await adapter.parseInbound(req);
    expect(adapter.verifyWebhook(req)).toBe(true);
  });

  it("accepts a valid signature when the raw body is passed in", () => {
    const adapter = createWhatsappAdapter({ appSecret: APP_SECRET });
    const sig = `sha256=${createHmac("sha256", APP_SECRET).update(payload).digest("hex")}`;
    const req = new Request("https://api.test/webhooks/whatsapp", {
      method: "POST",
      headers: { "x-hub-signature-256": sig },
      body: payload,
    });
    expect(adapter.verifyWebhook(req, payload)).toBe(true);
  });

  it("rejects a signature computed over a different body", async () => {
    const adapter = createWhatsappAdapter({ appSecret: APP_SECRET });
    const sig = `sha256=${createHmac("sha256", APP_SECRET).update("other").digest("hex")}`;
    const req = new Request("https://api.test/webhooks/whatsapp", {
      method: "POST",
      headers: { "x-hub-signature-256": sig },
      body: payload,
    });
    await adapter.parseInbound(req);
    expect(adapter.verifyWebhook(req)).toBe(false);
  });

  it("rejects a missing or malformed signature header", () => {
    const adapter = createWhatsappAdapter({ appSecret: APP_SECRET });
    const none = new Request("https://api.test/webhooks/whatsapp", {
      method: "POST",
      body: payload,
    });
    expect(adapter.verifyWebhook(none, payload)).toBe(false);
    const bad = new Request("https://api.test/webhooks/whatsapp", {
      method: "POST",
      headers: { "x-hub-signature-256": "sha1=abc" },
      body: payload,
    });
    expect(adapter.verifyWebhook(bad, payload)).toBe(false);
  });

  it("rejects when the app secret is not configured", () => {
    const adapter = createWhatsappAdapter({});
    const sig = `sha256=${createHmac("sha256", APP_SECRET).update(payload).digest("hex")}`;
    const req = new Request("https://api.test/webhooks/whatsapp", {
      method: "POST",
      headers: { "x-hub-signature-256": sig },
      body: payload,
    });
    expect(adapter.verifyWebhook(req, payload)).toBe(false);
  });
});

describe("whatsapp adapter parseInbound", () => {
  it("normalizes a messages payload", async () => {
    const adapter = createWhatsappAdapter({ appSecret: APP_SECRET });
    const body = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_ID",
          changes: [
            {
              field: "messages",
              value: {
                messaging_product: "whatsapp",
                metadata: { display_phone_number: "15550000000", phone_number_id: PHONE_ID },
                messages: [
                  {
                    from: "+15550001111",
                    id: "wamid.abc",
                    timestamp: "1700000000",
                    type: "text",
                    text: { body: "yes, done" },
                  },
                ],
              },
            },
          ],
        },
      ],
    });
    const req = new Request("https://api.test/webhooks/whatsapp", { method: "POST", body });
    const inbound = await adapter.parseInbound(req);
    expect(inbound).toMatchObject({
      channel: "whatsapp",
      threadId: "+15550001111",
      from: "+15550001111",
      text: "yes, done",
    });
    expect(inbound?.raw).toMatchObject({ object: "whatsapp_business_account" });
  });

  it("returns null when the payload has no message", async () => {
    const adapter = createWhatsappAdapter({ appSecret: APP_SECRET });
    const body = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [{ id: "WABA_ID", changes: [{ field: "messages", value: { statuses: [] } }] }],
    });
    const req = new Request("https://api.test/webhooks/whatsapp", { method: "POST", body });
    expect(await adapter.parseInbound(req)).toBeNull();
  });

  it("returns null for a non JSON body", async () => {
    const adapter = createWhatsappAdapter({ appSecret: APP_SECRET });
    const req = new Request("https://api.test/webhooks/whatsapp", {
      method: "POST",
      body: "not json",
    });
    expect(await adapter.parseInbound(req)).toBeNull();
  });
});

describe("verifyWhatsappChallenge", () => {
  it("returns the challenge for a valid subscribe request", () => {
    const url = new URL(
      "https://api.test/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=tok&hub.challenge=1234",
    );
    expect(verifyWhatsappChallenge(url, "tok")).toBe("1234");
  });

  it("returns null for a wrong verify token", () => {
    const url = new URL(
      "https://api.test/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=1234",
    );
    expect(verifyWhatsappChallenge(url, "tok")).toBeNull();
  });

  it("returns null when the mode is not subscribe", () => {
    const url = new URL(
      "https://api.test/webhooks/whatsapp?hub.mode=unsubscribe&hub.verify_token=tok&hub.challenge=1234",
    );
    expect(verifyWhatsappChallenge(url, "tok")).toBeNull();
  });
});
