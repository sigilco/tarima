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
const { eq } = await import("drizzle-orm");
const { db } = await import("../db");
const { entities, outreachMessages, projects, steps, users, workflows } =
  await import("../db/schema");
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
let entityId: string;
let runId: string;

beforeAll(() => {
  db.insert(users)
    .values({ id: "user-webhooks", email: "wh@tarima.test", createdAt: Date.now() })
    .onConflictDoNothing()
    .run();

  projectId = randomUUID();
  db.insert(projects)
    .values({ id: projectId, name: "Webhook project", createdAt: Date.now() })
    .run();

  entityId = randomUUID();
  db.insert(entities)
    .values({
      id: entityId,
      projectId,
      name: "Acme",
      contactEmail: "contact@acme.test",
      createdAt: Date.now(),
    })
    .run();

  runId = randomUUID();
  db.insert(workflows)
    .values({
      id: runId,
      type: "chase-deliverables",
      status: "running",
      state: "await_reply",
      context: {
        entityId,
        entityName: "Acme",
        contactEmail: "outreach@tarima.illo.fyi",
        contactPhone: "34600111222",
      },
      createdAt: Date.now(),
    })
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

  it("stores the inbound message and enqueues the parse step", async () => {
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

    const messages = db
      .select()
      .from(outreachMessages)
      .where(eq(outreachMessages.direction, "inbound"))
      .all();
    expect(messages.length).toBeGreaterThanOrEqual(1);
    const row = messages[messages.length - 1]!;
    expect(row.entityId).toBe(entityId);
    expect(row.direction).toBe("inbound");
    expect(row.body).toContain("everything is attached");
    expect(row.receivedAt).toBeTruthy();

    const parseSteps = db
      .select()
      .from(steps)
      .all()
      .filter((step) => step.runId === runId && step.stepKey.startsWith("chase.parse"));
    expect(parseSteps.length).toBeGreaterThanOrEqual(1);
    expect(parseSteps[0]!.status).toBe("pending");
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

  it("stores the inbound message for a valid payload", async () => {
    const body = JSON.stringify(WA_PAYLOAD);
    const res = await app.request("/webhooks/whatsapp", {
      method: "POST",
      headers: { "X-Hub-Signature-256": waSignature(body), "content-type": "application/json" },
      body,
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const waMessages = db
      .select()
      .from(outreachMessages)
      .all()
      .filter((row) => row.direction === "inbound" && row.body.includes("deck is ready"));
    expect(waMessages.length).toBeGreaterThanOrEqual(1);
    expect(waMessages[0]!.entityId).toBe(entityId);

    const parseSteps = db
      .select()
      .from(steps)
      .all()
      .filter((step) => step.runId === runId && step.stepKey.startsWith("chase.parse"));
    expect(parseSteps.length).toBeGreaterThanOrEqual(1);
  });
});
