/**
 * Outbox drain (T3-T5): stage an agent.email row, drain it through the
 * MailDev wrapper, and assert the whole approve-to-send path: Brevo-shaped
 * POST to MAIL_API_BASE_URL, compliance footer, rfq+ Reply-To threading,
 * provider Message-ID persisted, suppression honored.
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@tarima/api/db";
import { entities, events, outbox, outreachMessages, projects, users } from "@tarima/api/db/schema";
import {
  decodeRfqEntity,
  drainOutbox,
  renderOutreachBody,
  suppressEmail,
} from "@tarima/api/services/outreach-mail";
import { startMailDev } from "../../tests/mocks/maildev-mock.mjs";

const OWNER = "u-drain-owner";
const PROJECT = "p-drain-1";
const ENTITY = "ent-drain-1";

let mail: Awaited<ReturnType<typeof startMailDev>> & { baseUrl: string };

function stage(payload: Record<string, unknown>, key = randomUUID()): string {
  const id = randomUUID();
  db.insert(outbox)
    .values({ id, idempotencyKey: key, type: "agent.email", payload, status: "staged" })
    .run();
  return id;
}

beforeAll(async () => {
  const handle = startMailDev();
  const { baseUrl } = await handle.start();
  mail = Object.assign(handle, { baseUrl });
  process.env.MAIL_API_BASE_URL = baseUrl;
  process.env.OUTREACH_POSTAL_ADDRESS = "Tarima SL, Calle de Prueba 1, 28001 Madrid";

  db.insert(users)
    .values({ id: OWNER, email: "drain-owner@tarima.test" })
    .onConflictDoNothing()
    .run();
  db.insert(projects)
    .values({ id: PROJECT, ownerId: OWNER, name: "Drain project" })
    .onConflictDoNothing()
    .run();
  db.insert(entities)
    .values({
      id: ENTITY,
      projectId: PROJECT,
      name: "Acme Venue",
      contactEmail: "events@acme.test",
      status: "await_reply",
    })
    .onConflictDoNothing()
    .run();
});

afterAll(async () => {
  await mail.stop();
});

describe("drainOutbox", () => {
  it("sends a staged row through the provider and stores the Message-ID", async () => {
    const id = stage({
      projectId: PROJECT,
      to: "events@acme.test",
      subject: "Availability for a November event",
      body: "Hi, do you have space for 30 people on Nov 20?",
    });

    const result = await drainOutbox();
    expect(result.sent).toBe(1);

    const row = db.select().from(outbox).where(eq(outbox.id, id)).all()[0];
    expect(row?.status).toBe("sent");
    expect(row?.sentAt).toBeTruthy();
    const payload = row?.payload as { messageId?: string; replyTo?: string };
    expect(payload.messageId).toMatch(/^<mock-\d+@tarima\.test>$/);
    expect(payload.replyTo).toBe(`rfq+${ENTITY}@outreach.tarima.events`);

    const inbox = await fetch(`${mail.baseUrl}/inbox`).then((r) => r.json());
    const msg = inbox.messages.find((m: { subject: string }) => m.subject.includes("November"));
    expect(msg).toBeTruthy();
    expect(msg.sender.email).toBe("notifications@tarima.illo.fyi");
    expect(msg.replyTo).toBe(`rfq+${ENTITY}@outreach.tarima.events`);
    // The CAN-SPAM footer rides on every send.
    expect(msg.text).toContain("Calle de Prueba 1, 28001 Madrid");
    expect(msg.text).toContain("unsubscribe@outreach.tarima.events");

    // The outbound copy lands on the entity and an event is emitted.
    const msgs = db
      .select()
      .from(outreachMessages)
      .where(eq(outreachMessages.entityId, ENTITY))
      .all();
    expect(msgs).toHaveLength(1);
    expect(msgs[0]?.direction).toBe("outbound");
    const ev = db.select().from(events).where(eq(events.type, "outreach.email_sent")).all();
    expect(ev).toHaveLength(1);
  });

  it("refuses a suppressed recipient without sending", async () => {
    suppressEmail("blocked@acme.test", "asked to stop");
    const id = stage({ projectId: PROJECT, to: "blocked@acme.test", subject: "x", body: "y" });

    const before = mail.sent.length;
    const result = await drainOutbox();
    expect(result.suppressed).toBe(1);
    expect(mail.sent.length).toBe(before);

    const row = db.select().from(outbox).where(eq(outbox.id, id)).all()[0];
    expect(row?.status).toBe("failed");
    expect((row?.payload as { error?: string }).error).toContain("suppression");
  });

  it("marks provider refusals as failed instead of throwing", async () => {
    await mail.stop();
    const id = stage({ projectId: PROJECT, to: "x@acme.test", subject: "x", body: "y" });
    const result = await drainOutbox();
    expect(result.failed).toBe(1);
    const row = db.select().from(outbox).where(eq(outbox.id, id)).all()[0];
    expect(row?.status).toBe("failed");
  });
});

describe("rfq addressing", () => {
  it("round-trips the entity id through the reply address", () => {
    expect(decodeRfqEntity(`rfq+${ENTITY}@outreach.tarima.events`)).toBe(ENTITY);
    expect(decodeRfqEntity(`rfq-${ENTITY}@outreach.tarima.events`)).toBe(ENTITY);
    expect(decodeRfqEntity("venue@acme.test")).toBeNull();
  });

  it("appends the compliance footer to the body", () => {
    const rendered = renderOutreachBody("Hello");
    expect(rendered).toContain("Hello");
    expect(rendered).toContain("Calle de Prueba 1, 28001 Madrid");
    expect(rendered).toContain('Reply "stop"');
  });
});
