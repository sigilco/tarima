import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

/**
 * The fanout against a loopback channel: the same shape a real channel
 * has (an id and a send that either accepts or refuses), but it keeps
 * the messages in memory. That is the seam the live phone gates stand
 * in for: the flow is exercised end to end without a provider.
 */
const dir = mkdtempSync(join(tmpdir(), "tarima-loopback-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const { db } = await import("../db");
const { channelBindings, entities, projects, userMessages, users } = await import("../db/schema");
const { bindChannel } = await import("./bindings");
const { fanoutNotify } = await import("./notify");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const USER_ID = "user-loopback";
let projectId: string;
let entityId: string;

/** A loopback channel: it keeps what it was asked to deliver. */
class LoopbackChannel {
  readonly sent: Array<{ to: string; text: string }> = [];

  constructor(private readonly accept: boolean = true) {}

  async send(to: string, text: string): Promise<void> {
    if (!this.accept) throw new Error("loopback refused");
    this.sent.push({ to, text });
  }
}

beforeEach(() => {
  db.delete(userMessages).run();
  db.delete(channelBindings).run();
  db.delete(entities).run();
  db.delete(projects).run();

  db.insert(users)
    .values({ id: USER_ID, email: "loopback@tarima.test", createdAt: Date.now() })
    .onConflictDoNothing()
    .run();

  projectId = randomUUID();
  db.insert(projects)
    .values({
      id: projectId,
      ownerId: USER_ID,
      name: "Loopback project",
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

describe("notify fanout over a loopback channel", () => {
  it("delivers to the bound endpoint and writes the in-app copy", async () => {
    bindChannel(db, { userId: USER_ID, channel: "telegram", externalId: "555123" });
    const loopback = new LoopbackChannel();

    const result = await fanoutNotify(
      db,
      {
        projectId,
        entityId,
        kind: "status_change",
        summary: "Acme replied: 40 people on 5 December",
      },
      { telegram: { send: loopback.send.bind(loopback) } },
    );

    expect(result).toEqual({ inApp: true, delivered: 1, failed: 0 });
    expect(loopback.sent).toEqual([
      { to: "555123", text: "Acme replied: 40 people on 5 December" },
    ]);
    expect(db.select().from(userMessages).all()).toHaveLength(1);
  });

  it("keeps the in-app copy when the loopback channel refuses", async () => {
    bindChannel(db, { userId: USER_ID, channel: "telegram", externalId: "555123" });
    const loopback = new LoopbackChannel(false);

    const result = await fanoutNotify(
      db,
      { projectId, kind: "digest", summary: "2 replies in" },
      { telegram: { send: loopback.send.bind(loopback) } },
    );

    expect(result).toEqual({ inApp: true, delivered: 0, failed: 1 });
    const stored = db.select().from(userMessages).all();
    expect(stored).toHaveLength(1);
    expect(stored[0]?.summary).toBe("2 replies in");
  });

  it("delivers to every endpoint of the user", async () => {
    bindChannel(db, { userId: USER_ID, channel: "telegram", externalId: "555123" });
    bindChannel(db, { userId: USER_ID, channel: "telegram", externalId: "555999" });
    bindChannel(db, { userId: USER_ID, channel: "whatsapp", externalId: "34600111222" });
    const telegram = new LoopbackChannel();
    const whatsapp = new LoopbackChannel();

    const result = await fanoutNotify(
      db,
      { projectId, kind: "digest", summary: "3 rows chasing" },
      {
        telegram: { send: telegram.send.bind(telegram) },
        whatsapp: { send: whatsapp.send.bind(whatsapp) },
      },
    );

    expect(result.delivered).toBe(3);
    expect(telegram.sent.map((s) => s.to).toSorted()).toEqual(["555123", "555999"]);
    expect(whatsapp.sent.map((s) => s.to)).toEqual(["34600111222"]);
  });
});
