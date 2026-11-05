/**
 * Eve memory on SQLite (plan W4): the backend seam, principal
 * isolation, stranger handling, and restart survival — against the
 * temp sqlite db vitest.config points DATABASE_URL at.
 */
import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@tarima/api/db";
import { memoryDocuments, memoryJournal } from "@tarima/api/db/schema";
import { fileMemory } from "eve/memory/file";
import { inMemory } from "eve/memory/file";
import { defineMemory } from "eve/memory";
import { byPrincipal } from "eve/memory/scope";
import { memorySqliteBackend } from "./memory-sqlite";
import { rememberMemoryWrite } from "./mirror";

async function save(key: string, text: string) {
  const provider = fileMemory({ backend: memorySqliteBackend });
  const tools = await provider.tools!({
    abortSignal: new AbortController().signal,
    channel: { kind: "channel:test", metadata: {} },
    memory: {
      scope: { key, namespace: "test-ns", value: key },
      slot: "memory",
    },
    session: { id: "s", conversation: undefined } as never,
  });
  await tools!.save_memory.execute({ text }, {
    abortSignal: new AbortController().signal,
  } as never);
}

async function recall(key: string): Promise<string> {
  const provider = fileMemory({ backend: memorySqliteBackend });
  const result = await provider.recall["turn.started"]({
    abortSignal: new AbortController().signal,
    memory: { scope: { key, namespace: "test-ns", value: key }, slot: "memory" },
    messages: [],
    operationId: "op",
    session: { id: "s", auth: {} as never },
    turn: { id: "t", input: [], sequence: 1 },
  } as never);
  return result?.messages[0]?.content ?? "";
}

describe("memory sqlite backend", () => {
  it("survives a fresh provider instance (restart survival)", async () => {
    await save("user-restart", "Prefers evening venues");
    // A new provider over the same DB — what a process restart does —
    // must still recall the fact.
    const content = await recall("user-restart");
    expect(content).toContain("Prefers evening venues");
  });

  it("isolates principals: user A never recalls B's memory", async () => {
    await save("user-a-iso", "User A likes jazz venues");
    await save("user-b-iso", "User B likes rooftop venues");

    const a = await recall("user-a-iso");
    const b = await recall("user-b-iso");
    expect(a).toContain("jazz");
    expect(a).not.toContain("rooftop");
    expect(b).toContain("rooftop");
    expect(b).not.toContain("jazz");

    const rows = db.select().from(memoryDocuments).all();
    const keys = rows.map((r) => r.key);
    expect(keys).toContain("user-a-iso");
    expect(keys).toContain("user-b-iso");
    const aRow = rows.find((r) => r.key === "user-a-iso");
    expect(aRow?.content).not.toContain("rooftop");
  });

  it("optimistic writes reject a stale version", async () => {
    const first = await memorySqliteBackend.read({
      key: "user-occ",
      signal: new AbortController().signal,
    });
    expect(first).toBeNull();
    await memorySqliteBackend.write({
      key: "user-occ",
      content: "<!-- eve-memory-file-v1 lastAllocatedIndex=-1 -->\n",
      expectedVersion: null,
      signal: new AbortController().signal,
    });
    const second = await memorySqliteBackend.read({
      key: "user-occ",
      signal: new AbortController().signal,
    });
    expect(second).not.toBeNull();
    // Create-only against an existing row must conflict.
    await expect(
      memorySqliteBackend.write({
        key: "user-occ",
        content: "<!-- eve-memory-file-v1 lastAllocatedIndex=-1 -->\n",
        expectedVersion: null,
        signal: new AbortController().signal,
      }),
    ).rejects.toMatchObject({ name: "MemoryDocumentConflictError" });
  });
});

describe("memory scope definition", () => {
  const definition = defineMemory({
    provider: fileMemory({ backend: inMemory() }),
    scope: byPrincipal,
  });

  it("keys the scope by principal identity", async () => {
    const scope = await (typeof definition.scope === "function" ? definition.scope : null)?.({
      abortSignal: new AbortController().signal,
      channel: { kind: "channel:test", metadata: {} },
      session: {
        id: "s1",
        auth: {
          current: {
            authenticator: "tarima-session",
            principalId: "u-1",
            principalType: "user",
            attributes: {},
          },
        },
      },
    } as never);
    expect(scope).toBeDefined();
    expect(JSON.stringify(scope)).toContain("u-1");
  });

  it("resolves to null for anonymous principals (stranger gets no memory)", async () => {
    const scope = await (definition.scope as unknown as (ctx: unknown) => Promise<unknown>)({
      abortSignal: new AbortController().signal,
      channel: { kind: "channel:test", metadata: {} },
      session: {
        id: "s2",
        auth: { current: null },
      },
    });
    expect(scope).toBeNull();
  });
});

describe("memory journal mirror", () => {
  it("records save_memory calls and ignores other tools", () => {
    rememberMemoryWrite({
      callId: "call-mem-1",
      capability: { name: "memory__save_memory" },
      input: { text: "Likes jazz" },
      sessionId: "sess-mem",
      principalId: "u-mem",
      line: 42,
      index: 3,
    });
    rememberMemoryWrite({
      callId: "call-other",
      capability: { name: "send_email" },
      input: {},
      sessionId: "sess-mem",
      principalId: "u-mem",
      line: 43,
      index: 0,
    });

    const rows = db
      .select()
      .from(memoryJournal)
      .where(eq(memoryJournal.sessionId, "sess-mem"))
      .all();
    expect(rows).toHaveLength(1);
    expect(rows[0].action).toBe("save");
    expect(rows[0].principalId).toBe("u-mem");
    expect(rows[0].payload).toEqual({ text: "Likes jazz" });

    // Retried hook step (same position) is a no-op.
    rememberMemoryWrite({
      callId: "call-mem-1",
      capability: { name: "memory__save_memory" },
      input: { text: "Likes jazz" },
      sessionId: "sess-mem",
      principalId: "u-mem",
      line: 42,
      index: 3,
    });
    expect(
      db.select().from(memoryJournal).where(eq(memoryJournal.sessionId, "sess-mem")).all(),
    ).toHaveLength(1);
  });
});
