/**
 * SqliteStateAdapter (W3): the Chat SDK `StateAdapter` contract on the
 * shared better-sqlite3 database. Proves the behaviours Chat SDK relies
 * on for idempotency and durability: set-if-not-exists (the per-message
 * dedupe primitive), locks with token-verified extend/release, TTL
 * expiry, lists, and queues.
 */
import { describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import type { QueueEntry } from "chat";
import { createSqliteState } from "./chat-state-sqlite";

function freshAdapter(table = `chat_sdk_state_${Math.random().toString(36).slice(2)}`) {
  const database = new Database(":memory:");
  return { adapter: createSqliteState({ database, table }), database };
}

describe("SqliteStateAdapter", () => {
  it("get/set/delete round-trips values", async () => {
    const { adapter } = freshAdapter();
    await adapter.set("k", { a: 1 });
    expect(await adapter.get<{ a: number }>("k")).toEqual({ a: 1 });
    await adapter.delete("k");
    expect(await adapter.get("k")).toBeNull();
  });

  it("setIfNotExists is the once-only dedupe primitive", async () => {
    const { adapter } = freshAdapter();
    expect(await adapter.setIfNotExists("dedupe:wamid.ABC", true)).toBe(true);
    expect(await adapter.setIfNotExists("dedupe:wamid.ABC", true)).toBe(false);
    expect(await adapter.setIfNotExists("dedupe:wamid.DEF", true)).toBe(true);
  });

  it("expired keys vanish (ttl path)", async () => {
    const { adapter } = freshAdapter();
    await adapter.set("ttl", "v", 5);
    await new Promise((r) => setTimeout(r, 15));
    expect(await adapter.get("ttl")).toBeNull();
    expect(await adapter.setIfNotExists("ttl", "again", 5000)).toBe(true);
  });

  it("locks: single holder, token-verified extend and release", async () => {
    const { adapter } = freshAdapter();
    const lock = await adapter.acquireLock("thread-1", 5000);
    expect(lock).not.toBeNull();
    expect(await adapter.acquireLock("thread-1", 5000)).toBeNull();
    expect(await adapter.extendLock(lock!, 5000)).toBe(true);

    // A different token can neither extend nor release.
    expect(
      await adapter.extendLock({ threadId: "thread-1", token: "other", expiresAt: 1 }, 5000),
    ).toBe(false);
    await adapter.releaseLock({ threadId: "thread-1", token: "other", expiresAt: 1 });
    expect(await adapter.acquireLock("thread-1", 5000)).toBeNull();

    await adapter.releaseLock(lock!);
    expect(await adapter.acquireLock("thread-1", 5000)).not.toBeNull();
  });

  it("expired locks are reclaimable", async () => {
    const { adapter } = freshAdapter();
    expect(await adapter.acquireLock("thread-2", 5)).not.toBeNull();
    await new Promise((r) => setTimeout(r, 15));
    expect(await adapter.acquireLock("thread-2", 5000)).not.toBeNull();
  });

  it("appendToList/getList trims to maxLength", async () => {
    const { adapter } = freshAdapter();
    for (const n of [1, 2, 3, 4]) await adapter.appendToList("list", n, { maxLength: 3 });
    expect(await adapter.getList<number>("list")).toEqual([2, 3, 4]);
    expect(await adapter.getList<number>("missing")).toEqual([]);
  });

  it("enqueue/dequeue/queueDepth is FIFO with a bounded size", async () => {
    const { adapter } = freshAdapter();
    // A minimal stand-in Message: the adapter treats queue payloads as
    // opaque JSON, so only the identity we assert on must be present.
    const entry = (n: number): QueueEntry => ({
      enqueuedAt: Date.now(),
      expiresAt: Date.now() + 60_000,
      message: { id: `m${n}`, text: String(n) } as QueueEntry["message"],
    });
    expect(await adapter.enqueue("t", entry(1), 2)).toBe(1);
    expect(await adapter.enqueue("t", entry(2), 2)).toBe(2);
    expect(await adapter.enqueue("t", entry(3), 2)).toBe(2);
    expect(await adapter.queueDepth("t")).toBe(2);
    const first = (await adapter.dequeue("t")) as { message?: { id?: string } } | null;
    expect(first?.message?.id).toBe("m2");
    const second = (await adapter.dequeue("t")) as { message?: { id?: string } } | null;
    expect(second?.message?.id).toBe("m3");
    expect(await adapter.dequeue("t")).toBeNull();
  });

  it("subscribe/isSubscribed persists per thread", async () => {
    const { adapter } = freshAdapter();
    expect(await adapter.isSubscribed("t9")).toBe(false);
    await adapter.subscribe("t9");
    expect(await adapter.isSubscribed("t9")).toBe(true);
    await adapter.unsubscribe("t9");
    expect(await adapter.isSubscribed("t9")).toBe(false);
  });
});
