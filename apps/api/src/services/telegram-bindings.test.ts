import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

const dir = mkdtempSync(join(tmpdir(), "tarima-tgstore-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.NODE_ENV = "test";

const { db } = await import("../db");
const { channelBindings, users } = await import("../db/schema");
const { bindChannel } = await import("./bindings");
const { SqliteBindingStore } = await import("./telegram-bindings");

afterAll(() => rmSync(dir, { recursive: true, force: true }));

const USER_ID = "user-tgstore";

beforeEach(() => {
  db.delete(channelBindings).run();
  db.insert(users)
    .values({ id: USER_ID, email: "tgstore@tarima.test", createdAt: Date.now() })
    .onConflictDoNothing()
    .run();
});

/** A chat connected for notifications (the connect flow's row). */
function connected(chatId: number): void {
  bindChannel(db, {
    userId: USER_ID,
    channel: "telegram",
    externalId: String(chatId),
  });
}

describe("SqliteBindingStore", () => {
  it("survives a reopen of the database", () => {
    connected(42);
    const store = new SqliteBindingStore(db);
    store.set(42, "proj-1");

    // A fresh instance over the same file is what a restarted process
    // would hold; the binding must still be there.
    const reopened = new SqliteBindingStore(db);
    expect(reopened.get(42)).toBe("proj-1");
    expect(reopened.listForProject("proj-1")).toEqual([42]);
  });

  it("answers undefined for a chat that was never connected", () => {
    const store = new SqliteBindingStore(db);
    expect(store.get(7)).toBeUndefined();
  });

  it("ignores a project bind for a chat with no user binding", () => {
    const store = new SqliteBindingStore(db);
    store.set(7, "proj-1");
    expect(store.get(7)).toBeUndefined();
  });

  it("rebinds a chat to another project", () => {
    connected(42);
    const store = new SqliteBindingStore(db);
    store.set(42, "proj-1");
    store.set(42, "proj-2");
    expect(store.get(42)).toBe("proj-2");
    expect(store.listForProject("proj-1")).toEqual([]);
    expect(store.listForProject("proj-2")).toEqual([42]);
  });

  it("unbinding clears the project but keeps the user binding", () => {
    connected(42);
    const store = new SqliteBindingStore(db);
    store.set(42, "proj-1");
    store.remove(42);

    expect(store.get(42)).toBeUndefined();
    const rows = db.select().from(channelBindings).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.userId).toBe(USER_ID);
    expect(rows[0]?.label).toBeNull();
  });

  it("lists only the chats of the requested project", () => {
    connected(1);
    connected(2);
    connected(3);
    const store = new SqliteBindingStore(db);
    store.set(1, "proj-1");
    store.set(2, "proj-1");
    store.set(3, "proj-2");

    expect(store.listForProject("proj-1").toSorted((a, b) => a - b)).toEqual([1, 2]);
    expect(store.listForProject("proj-2")).toEqual([3]);
    expect(store.listForProject("proj-3")).toEqual([]);
  });

  it("ignores non telegram rows", () => {
    bindChannel(db, {
      userId: USER_ID,
      channel: "whatsapp",
      externalId: "34600111222",
      label: "project:proj-1",
    });
    const store = new SqliteBindingStore(db);
    expect(store.listForProject("proj-1")).toEqual([]);
  });
});
