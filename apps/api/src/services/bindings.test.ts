import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "tarima-bindings-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const { db } = await import("../db");
const { channelBindings, users } = await import("../db/schema");
const { bindChannel, boundExternalIds, listBindings, unbindChannel } = await import("./bindings");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const ALICE = "user-alice";
const BOB = "user-bob";

beforeEach(() => {
  db.delete(channelBindings).run();
  for (const [id, email] of [
    [ALICE, "alice@tarima.test"],
    [BOB, "bob@tarima.test"],
  ] as const) {
    db.insert(users).values({ id, email, createdAt: Date.now() }).onConflictDoNothing().run();
  }
});

describe("channel bindings", () => {
  it("binds an endpoint and lists it for the user", () => {
    const binding = bindChannel(db, {
      userId: ALICE,
      channel: "telegram",
      externalId: "555123",
      label: "phone",
    });
    expect(binding.channel).toBe("telegram");
    expect(binding.label).toBe("phone");
    expect(listBindings(db, ALICE)).toHaveLength(1);
    expect(listBindings(db, BOB)).toHaveLength(0);
  });

  it("is idempotent for the same endpoint", () => {
    const first = bindChannel(db, { userId: ALICE, channel: "telegram", externalId: "555123" });
    const second = bindChannel(db, { userId: ALICE, channel: "telegram", externalId: "555123" });
    expect(second.id).toBe(first.id);
    expect(listBindings(db, ALICE)).toHaveLength(1);
  });

  it("moves an endpoint to the new owner when it is rebound", () => {
    bindChannel(db, { userId: ALICE, channel: "whatsapp", externalId: "34600111222" });
    bindChannel(db, { userId: BOB, channel: "whatsapp", externalId: "34600111222" });
    expect(listBindings(db, ALICE)).toHaveLength(0);
    expect(listBindings(db, BOB)).toHaveLength(1);
  });

  it("lists the endpoints of one channel only", () => {
    bindChannel(db, { userId: ALICE, channel: "telegram", externalId: "555123" });
    bindChannel(db, { userId: ALICE, channel: "whatsapp", externalId: "34600111222" });
    expect(boundExternalIds(db, ALICE, "telegram")).toEqual(["555123"]);
    expect(boundExternalIds(db, ALICE, "whatsapp")).toEqual(["34600111222"]);
  });

  it("unbinds by id, scoped to the owner", () => {
    const binding = bindChannel(db, { userId: ALICE, channel: "telegram", externalId: "555123" });
    unbindChannel(db, BOB, binding.id);
    expect(listBindings(db, ALICE)).toHaveLength(1);
    unbindChannel(db, ALICE, binding.id);
    expect(listBindings(db, ALICE)).toHaveLength(0);
  });
});
