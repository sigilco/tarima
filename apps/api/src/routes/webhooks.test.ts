import { createHmac, randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// The database url and the webhook secrets must be set BEFORE the
// modules are imported: the api opens the sqlite file at import time
// and the channel adapters read their secrets when they are built.
const dir = mkdtempSync(join(tmpdir(), "tarima-webhooks-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";
process.env.INBOUND_WEBHOOK_SECRET = "s3cret-email";
process.env.WHATSAPP_APP_SECRET = "s3cret-wa";
process.env.WHATSAPP_VERIFY_TOKEN = "verify-token";

const { Hono } = await import("hono");
const { db } = await import("../db");
const { projects, users } = await import("../db/schema");
const { webhookRoutes } = await import("./webhooks");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const app = new Hono().route("/", webhookRoutes);

const EMAIL_SECRET = "s3cret-email";
const WA_SECRET = "s3cret-wa";

/** A minimal RFC 5322 message. */
const MIME = [
  "From: Contact <contact@acme.test>",
  "To: outreach@tarima.illo.fyi",
  "Subject: Re: deliverables",
  "Content-Type: text/plain; charset=utf-8",
  "",
  "Done, everything is attached.",
].join("\r\n");

const WA_PAYLOAD = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "WABA_ID",
      changes: [
        {
          field: "messages",
          value: {
            messages: [
              {
                from: "34600111222",
                id: "wamid.ABC",
                timestamp: "1730000000",
                type: "text",
                text: { body: "Sent, the deck is ready" },
              },
            ],
          },
        },
      ],
    },
  ],
};

function waSignature(body: string): string {
  return `sha256=${createHmac("sha256", WA_SECRET).update(body).digest("hex")}`;
}

let projectId: string;

beforeAll(() => {
  db.insert(users)
    .values({ id: "user-webhooks", email: "wh@tarima.test", createdAt: Date.now() })
    .onConflictDoNothing()
    .run();

  projectId = randomUUID();
  db.insert(projects)
    .values({ id: projectId, name: "Webhook project", createdAt: Date.now() })
    .run();
});

describe("POST /webhooks/email", () => {
  it("rejects a bad secret with 401", async () => {
    const res = await app.request("/webhooks/email", {
      method: "POST",
      headers: { "X-Webhook-Secret": "wrong", "content-type": "application/json" },
      body: JSON.stringify({ raw: MIME }),
    });
    expect(res.status).toBe(401);
  });

  it("acknowledges an unmatched reply without persisting it", async () => {
    const { outreachMessages } = await import("../db/schema");
    const before = db.select().from(outreachMessages).all().length;
    const res = await app.request("/webhooks/email", {
      method: "POST",
      headers: { "X-Webhook-Secret": EMAIL_SECRET, "content-type": "application/json" },
      body: JSON.stringify({
        raw: MIME,
        to: "outreach@tarima.illo.fyi",
        from: "contact@acme.test",
      }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(db.select().from(outreachMessages).all()).toHaveLength(before);
  });

  it("persists a reply addressed to rfq+<entityId> and bumps the entity", async () => {
    const { entities, events, outreachMessages } = await import("../db/schema");
    const entityId = "ent-reply-1";
    db.insert(entities)
      .values({
        id: entityId,
        projectId,
        name: "Reply Venue",
        contactEmail: "reply@venue.test",
        status: "await_reply",
      })
      .run();

    const res = await app.request("/webhooks/email", {
      method: "POST",
      headers: { "X-Webhook-Secret": EMAIL_SECRET, "content-type": "application/json" },
      body: JSON.stringify({
        raw: MIME,
        to: `rfq+${entityId}@outreach.tarima.events`,
        from: "reply@venue.test",
      }),
    });
    expect(res.status).toBe(200);

    const msgs = db
      .select()
      .from(outreachMessages)
      .all()
      .filter((r) => r.entityId === entityId);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]?.direction).toBe("inbound");
    expect(msgs[0]?.body).toContain("everything is attached");

    const entity = db
      .select()
      .from(entities)
      .all()
      .find((e) => e.id === entityId);
    expect(entity?.status).toBe("parsed");

    const ev = db
      .select()
      .from(events)
      .all()
      .filter((e) => e.type === "outreach.reply" && e.subjectId === entityId);
    expect(ev).toHaveLength(1);
  });

  it("falls back to matching entities.contactEmail when there is no rfq tag", async () => {
    const { entities, outreachMessages } = await import("../db/schema");
    const entityId = "ent-reply-2";
    db.insert(entities)
      .values({
        id: entityId,
        projectId,
        name: "Contact Venue",
        contactEmail: "desk@venue.test",
        status: "await_reply",
      })
      .run();

    const res = await app.request("/webhooks/email", {
      method: "POST",
      headers: { "X-Webhook-Secret": EMAIL_SECRET, "content-type": "application/json" },
      body: JSON.stringify({
        raw: MIME,
        to: "outreach@tarima.illo.fyi",
        from: "Desk <desk@venue.test>",
      }),
    });
    expect(res.status).toBe(200);
    const msgs = db
      .select()
      .from(outreachMessages)
      .all()
      .filter((r) => r.entityId === entityId);
    expect(msgs).toHaveLength(1);
  });

  it("accepts a raw mime body without the json envelope", async () => {
    const res = await app.request("/webhooks/email", {
      method: "POST",
      headers: { "X-Webhook-Secret": EMAIL_SECRET, "content-type": "message/rfc822" },
      body: MIME,
    });
    expect(res.status).toBe(200);
  });
});

describe("GET /webhooks/whatsapp", () => {
  it("echoes the challenge when the verify token matches", async () => {
    const res = await app.request(
      "/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=verify-token&hub.challenge=1234",
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("1234");
  });

  it("answers 403 for a wrong verify token", async () => {
    const res = await app.request(
      "/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=1234",
    );
    expect(res.status).toBe(403);
  });
});

describe("POST /webhooks/whatsapp", () => {
  it("rejects a bad signature with 401", async () => {
    const res = await app.request("/webhooks/whatsapp", {
      method: "POST",
      headers: { "X-Hub-Signature-256": "sha256=deadbeef", "content-type": "application/json" },
      body: JSON.stringify(WA_PAYLOAD),
    });
    expect(res.status).toBe(401);
  });

  it("acknowledges a valid payload without persisting it", async () => {
    const body = JSON.stringify(WA_PAYLOAD);
    const res = await app.request("/webhooks/whatsapp", {
      method: "POST",
      headers: { "X-Hub-Signature-256": waSignature(body), "content-type": "application/json" },
      body,
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});

describe("whatsapp connect flow", () => {
  it("binds the number when the tester sends the connect code", async () => {
    const { createConnectCode } = await import("../services/connect-codes");
    const { channelBindings } = await import("../db/schema");

    const created = createConnectCode(db, "user-webhooks", "whatsapp");
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "WABA_ID",
          changes: [
            {
              field: "messages",
              value: {
                messages: [
                  {
                    from: "34600999888",
                    id: "wamid.CONNECT",
                    timestamp: "1730000001",
                    type: "text",
                    text: { body: created.code },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const body = JSON.stringify(payload);
    const res = await app.request("/webhooks/whatsapp", {
      method: "POST",
      headers: { "X-Hub-Signature-256": waSignature(body), "content-type": "application/json" },
      body,
    });
    expect(res.status).toBe(200);

    const bindings = db
      .select()
      .from(channelBindings)
      .all()
      .filter((row) => row.externalId === "34600999888");
    expect(bindings).toHaveLength(1);
    expect(bindings[0]?.userId).toBe("user-webhooks");
    expect(bindings[0]?.channel).toBe("whatsapp");
  });

  it("does not bind on a message without a code", async () => {
    const { channelBindings } = await import("../db/schema");
    const before = db.select().from(channelBindings).all().length;

    const payload = {
      entry: [
        {
          changes: [
            {
              field: "messages",
              value: {
                messages: [
                  {
                    from: "34600777777",
                    id: "wamid.HI",
                    timestamp: "1730000002",
                    type: "text",
                    text: { body: "hi there" },
                  },
                ],
              },
            },
          ],
        },
      ],
    };
    const body = JSON.stringify(payload);
    await app.request("/webhooks/whatsapp", {
      method: "POST",
      headers: { "X-Hub-Signature-256": waSignature(body), "content-type": "application/json" },
      body,
    });

    expect(db.select().from(channelBindings).all()).toHaveLength(before);
  });

  it("consumes the code, so a second send does not rebind", async () => {
    const { createConnectCode } = await import("../services/connect-codes");
    const { channelBindings } = await import("../db/schema");

    const created = createConnectCode(db, "user-webhooks", "whatsapp");
    const send = async (from: string) => {
      const payload = {
        entry: [
          {
            changes: [
              {
                field: "messages",
                value: {
                  messages: [
                    {
                      from,
                      id: "wamid.X",
                      timestamp: "1730000003",
                      type: "text",
                      text: { body: created.code },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };
      const body = JSON.stringify(payload);
      await app.request("/webhooks/whatsapp", {
        method: "POST",
        headers: { "X-Hub-Signature-256": waSignature(body), "content-type": "application/json" },
        body,
      });
    };

    await send("34600666666");
    await send("34600555555");

    const bindings = db
      .select()
      .from(channelBindings)
      .all()
      .filter(
        (row) =>
          row.channel === "whatsapp" &&
          (row.externalId === "34600666666" || row.externalId === "34600555555"),
      );
    expect(bindings).toHaveLength(1);
    expect(bindings[0]?.externalId).toBe("34600666666");
  });
});
