import { afterEach, describe, expect, it } from "vitest";
import { createEmailAdapter } from "../src/providers/email";
import type { LoopbackSink } from "../src/providers/email";
import type { OutboundMessage } from "../src/types";

const ENV_KEYS = [
  "EMAIL_LOOPBACK_DOMAINS",
  "BREVO_API_KEY",
  "MAIL_FROM",
  "INBOUND_WEBHOOK_SECRET",
] as const;
const saved: Record<string, string | undefined> = {};
for (const key of ENV_KEYS) saved[key] = process.env[key];
afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key]!;
  }
});

interface Recorded {
  to: string;
  from?: string;
  subject: string;
  body: string;
  html?: string;
}

function memorySink(): { sink: LoopbackSink; rows: Recorded[] } {
  const rows: Recorded[] = [];
  return { sink: { save: (m) => rows.push(m) }, rows };
}

const msg = (over: Partial<OutboundMessage> = {}): OutboundMessage => ({
  channel: "email",
  to: "venue@tarima.test",
  subject: "Deliverables",
  text: "plain body",
  ...over,
});

describe("email adapter send: transport selection", () => {
  it("routes loopback domains to the sink", async () => {
    const { sink, rows } = memorySink();
    const adapter = createEmailAdapter({ loopback: sink });
    const res = await adapter.send(msg());
    expect(res).toEqual({
      externalId: "loopback:venue@tarima.test",
      provider: "loopback",
      accepted: true,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      to: "venue@tarima.test",
      subject: "Deliverables",
      body: "plain body",
    });
  });

  it("derives text from html when the text part is empty", async () => {
    const { sink, rows } = memorySink();
    const adapter = createEmailAdapter({ loopback: sink });
    await adapter.send(msg({ text: "", html: "<p>Hello <b>world</b></p>" }));
    expect(rows[0]!.body).toBe("Hello world");
  });

  it("uses brevo for non loopback recipients when a key is set", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchImpl = (async (url: string | URL, init: RequestInit) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify({ messageId: "brevo-123" }), { status: 200 });
    }) as typeof fetch;
    const adapter = createEmailAdapter({
      brevoApiKey: "key",
      mailFrom: "notices@tarima.events",
      loopbackDomains: "tarima.test",
      fetchImpl,
    });
    const res = await adapter.send(msg({ to: "venue@example.com" }));
    expect(res).toEqual({ externalId: "brevo-123", provider: "brevo", accepted: true });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("https://api.brevo.com/v3/smtp/email");
    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers["api-key"]).toBe("key");
    const body = JSON.parse(calls[0]!.init.body as string);
    expect(body).toMatchObject({
      sender: { email: "notices@tarima.events" },
      to: [{ email: "venue@example.com" }],
      subject: "Deliverables",
      textContent: "plain body",
    });
  });

  it("returns accepted:false with a reason on a brevo refusal instead of throwing", async () => {
    const fetchImpl = (async () => new Response("invalid key", { status: 401 })) as typeof fetch;
    const adapter = createEmailAdapter({ brevoApiKey: "bad", fetchImpl });
    const res = await adapter.send(msg({ to: "venue@example.com" }));
    expect(res.accepted).toBe(false);
    expect(res.provider).toBe("brevo");
    expect(res.reason).toMatch(/brevo send failed: 401/);
  });

  it("falls back to the file outbox when no brevo key is configured", async () => {
    const saved: unknown[] = [];
    const adapter = createEmailAdapter({
      outbox: { save: (m) => saved.push(m) },
      loopbackDomains: "-none-",
    });
    const res = await adapter.send(msg({ to: "venue@example.com" }));
    expect(res).toEqual({
      externalId: "file:venue@example.com",
      provider: "file",
      accepted: true,
    });
    expect(saved).toHaveLength(1);
  });

  it("refuses the loopback path when no sink is bound", async () => {
    const adapter = createEmailAdapter({});
    const res = await adapter.send(msg());
    expect(res.accepted).toBe(false);
    expect(res.reason).toBe("no loopback sink configured");
  });

  it("falls back to the env for the loopback domains and the sender", async () => {
    process.env.EMAIL_LOOPBACK_DOMAINS = "capture.test";
    process.env.MAIL_FROM = "notices@tarima.events";
    const { sink, rows } = memorySink();
    const adapter = createEmailAdapter({ loopback: sink });
    const res = await adapter.send(msg({ to: "someone@capture.test" }));
    expect(res.provider).toBe("loopback");
    expect(rows[0]!.from).toBe("notices@tarima.events");
  });

  it("uses brevo when BREVO_API_KEY is set in the env", async () => {
    process.env.BREVO_API_KEY = "env-key";
    const calls: Array<{ init: RequestInit }> = [];
    const fetchImpl = (async (_url: string | URL, init: RequestInit) => {
      calls.push({ init });
      return new Response(JSON.stringify({ messageId: "env-1" }), { status: 200 });
    }) as typeof fetch;
    const adapter = createEmailAdapter({ fetchImpl });
    const res = await adapter.send(msg({ to: "venue@example.com" }));
    expect(res.provider).toBe("brevo");
    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers["api-key"]).toBe("env-key");
  });
});

describe("email adapter verifyWebhook", () => {
  it("accepts a matching X-Webhook-Secret", () => {
    const adapter = createEmailAdapter({ inboundWebhookSecret: "s3cret" });
    const req = new Request("https://api.test/webhooks/email", {
      headers: { "x-webhook-secret": "s3cret" },
    });
    expect(adapter.verifyWebhook(req)).toBe(true);
  });

  it("rejects a wrong secret", () => {
    const adapter = createEmailAdapter({ inboundWebhookSecret: "s3cret" });
    const req = new Request("https://api.test/webhooks/email", {
      headers: { "x-webhook-secret": "wrong" },
    });
    expect(adapter.verifyWebhook(req)).toBe(false);
  });

  it("rejects when no secret is configured", () => {
    const adapter = createEmailAdapter({});
    const req = new Request("https://api.test/webhooks/email", {
      headers: { "x-webhook-secret": "s3cret" },
    });
    expect(adapter.verifyWebhook(req)).toBe(false);
  });
});

const RAW_MIME = [
  "From: Venue Team <venue@example.com>",
  "To: row-42@tarima.illo.fyi",
  "Subject: Re: Deliverables",
  "Content-Type: text/plain; charset=utf-8",
  "",
  "Done, invoice attached.",
  "",
].join("\r\n");

describe("email adapter parseInbound", () => {
  it("normalizes a raw MIME message", async () => {
    const adapter = createEmailAdapter({});
    const req = new Request("https://api.test/webhooks/email", {
      method: "POST",
      body: RAW_MIME,
    });
    const inbound = await adapter.parseInbound(req);
    expect(inbound).toMatchObject({
      channel: "email",
      threadId: "row-42@tarima.illo.fyi",
      from: "venue@example.com",
      subject: "Re: Deliverables",
      text: "Done, invoice attached.",
    });
    expect(inbound?.raw).toBeDefined();
  });

  it("trims trailing whitespace from the text part", async () => {
    const raw = [
      "From: venue@example.com",
      "To: row-42@tarima.illo.fyi",
      "Subject: hi",
      "Content-Type: text/plain",
      "",
      "line one\r\nline two\r\n\r\n",
      "",
    ].join("\r\n");
    const adapter = createEmailAdapter({});
    const req = new Request("https://api.test/webhooks/email", { method: "POST", body: raw });
    const inbound = await adapter.parseInbound(req);
    expect(inbound?.text).toBe("line one\nline two");
  });

  it("falls back to html text extraction", async () => {
    const raw = [
      "From: venue@example.com",
      "To: row-42@tarima.illo.fyi",
      "Subject: Re: Deliverables",
      "Content-Type: text/html; charset=utf-8",
      "",
      "<p>All <b>sent</b></p>",
      "",
    ].join("\r\n");
    const adapter = createEmailAdapter({});
    const req = new Request("https://api.test/webhooks/email", { method: "POST", body: raw });
    const inbound = await adapter.parseInbound(req);
    expect(inbound?.text).toBe("All sent");
  });

  it("returns null for an empty body", async () => {
    const adapter = createEmailAdapter({});
    const req = new Request("https://api.test/webhooks/email", { method: "POST", body: "" });
    expect(await adapter.parseInbound(req)).toBeNull();
  });
});
