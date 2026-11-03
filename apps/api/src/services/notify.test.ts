import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "tarima-notify-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const { db } = await import("../db");
const { channelBindings, entities, projects, userMessages, users } = await import("../db/schema");
const { bindChannel } = await import("./bindings");
const { fanoutNotify, payloadFromEffect, projectOwner, storeInAppMessage } =
  await import("./notify");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const USER_ID = "user-notify";
let projectId: string;
let entityId: string;

beforeEach(() => {
  db.delete(userMessages).run();
  db.delete(channelBindings).run();
  db.delete(entities).run();
  db.delete(projects).run();

  db.insert(users)
    .values({ id: USER_ID, email: "notify@tarima.test", createdAt: Date.now() })
    .onConflictDoNothing()
    .run();

  projectId = randomUUID();
  db.insert(projects)
    .values({
      id: projectId,
      ownerId: USER_ID,
      name: "Beta launch",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    .run();

  entityId = randomUUID();
  db.insert(entities)
    .values({
      id: entityId,
      projectId,
      name: "Acme",
      status: "chasing",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    .run();
});

/** A sender that records what it was asked to deliver. */
function recorder(): {
  sent: Array<{ to: string; text: string }>;
  send: (to: string, text: string) => Promise<void>;
} {
  const sent: Array<{ to: string; text: string }> = [];
  return {
    sent,
    async send(to: string, text: string) {
      sent.push({ to, text });
    },
  };
}

describe("notify fanout", () => {
  it("writes the in-app copy and delivers to every bound channel", async () => {
    bindChannel(db, { userId: USER_ID, channel: "telegram", externalId: "555123" });
    bindChannel(db, { userId: USER_ID, channel: "whatsapp", externalId: "34600111222" });

    const telegram = recorder();
    const whatsapp = recorder();

    const result = await fanoutNotify(
      db,
      {
        projectId,
        entityId,
        kind: "status_change",
        summary: "Acme replied: yes, we can host 40 people",
      },
      { telegram: { send: telegram.send }, whatsapp: { send: whatsapp.send } },
    );

    expect(result).toEqual({ inApp: true, delivered: 2, failed: 0 });
    expect(telegram.sent).toEqual([
      { to: "555123", text: "Acme replied: yes, we can host 40 people" },
    ]);
    expect(whatsapp.sent).toHaveLength(1);

    const stored = db.select().from(userMessages).all();
    expect(stored).toHaveLength(1);
    expect(stored[0]?.summary).toBe("Acme replied: yes, we can host 40 people");
    expect(stored[0]?.readAt).toBeNull();
  });

  it("keeps the in-app copy when a channel refuses", async () => {
    bindChannel(db, { userId: USER_ID, channel: "telegram", externalId: "555123" });

    const result = await fanoutNotify(
      db,
      { projectId, kind: "digest", summary: "2 replies in" },
      {
        telegram: {
          send: async () => {
            throw new Error("chat not found");
          },
        },
      },
    );

    expect(result).toEqual({ inApp: true, delivered: 0, failed: 1 });
    expect(db.select().from(userMessages).all()).toHaveLength(1);
  });

  it("skips a project without an owner", async () => {
    const orphan = randomUUID();
    db.insert(projects)
      .values({ id: orphan, name: "Orphan", createdAt: Date.now(), updatedAt: Date.now() })
      .run();

    const telegram = recorder();
    const result = await fanoutNotify(
      db,
      { projectId: orphan, kind: "digest", summary: "hello" },
      { telegram: { send: telegram.send } },
    );

    expect(result).toEqual({ inApp: false, delivered: 0, failed: 0 });
    expect(telegram.sent).toHaveLength(0);
    expect(db.select().from(userMessages).all()).toHaveLength(0);
  });

  it("does not deliver to another user's binding", async () => {
    db.insert(users)
      .values({ id: "other-user", email: "other@tarima.test", createdAt: Date.now() })
      .onConflictDoNothing()
      .run();
    bindChannel(db, { userId: "other-user", channel: "telegram", externalId: "999" });

    const telegram = recorder();
    await fanoutNotify(
      db,
      { projectId, kind: "digest", summary: "hello" },
      { telegram: { send: telegram.send } },
    );

    expect(telegram.sent).toHaveLength(0);
  });

  it("reads the project owner", () => {
    expect(projectOwner(db, projectId)).toBe(USER_ID);
    expect(projectOwner(db, randomUUID())).toBeNull();
  });
});

describe("payloadFromEffect", () => {
  it("passes a contract payload through", () => {
    const payload = {
      projectId,
      kind: "approval_needed" as const,
      summary: "Approve the shortlist?",
    };
    expect(payloadFromEffect(db, { payload })).toEqual(payload);
  });

  it("builds a status change from an entity reference", () => {
    const payload = payloadFromEffect(db, { payload: { entityId } });
    expect(payload).toEqual({
      projectId,
      entityId,
      kind: "status_change",
      summary: "Acme: chasing",
    });
  });

  it("returns null when nothing is known", () => {
    expect(payloadFromEffect(db, { payload: {} })).toBeNull();
  });
});

describe("storeInAppMessage", () => {
  it("keeps the summary verbatim", () => {
    storeInAppMessage(db, USER_ID, {
      projectId,
      kind: "status_change",
      summary: "Front line first",
    });
    const row = db.select().from(userMessages).all()[0]!;
    expect(row.summary).toBe("Front line first");
    expect(row.projectId).toBe(projectId);
  });
});
