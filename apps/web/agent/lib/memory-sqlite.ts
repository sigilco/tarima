/**
 * SQLite backend for eve's file-memory provider (plan W4).
 *
 * eve's `fileMemory()` (vendored, `eve/memory/file`) owns the bounded,
 * model-maintained memory document: parsing, indexes, character limits,
 * the save/remove tools, and recall at turn boundaries. It needs only a
 * `MemoryDocumentBackend` — a keyed, optimistic-concurrency document
 * store. This file implements that seam on better-sqlite3 against the
 * SAME database the rest of tarima uses (`@tarima/api/db`), so the
 * existing Litestream backup covers memory too, and recall survives
 * restarts by construction.
 *
 * Isolation comes from the scope key: eve derives it from the session's
 * auth principal (see `agent/memory.ts` + `byPrincipal`), so two users
 * never share a row. Unknown principals (strangers) resolve to a null
 * scope inside eve, which disables the slot entirely — no reads, no
 * writes, no memory tools.
 */
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@tarima/api/db";
import { memoryDocuments } from "@tarima/api/db/schema";
import { MemoryDocumentConflictError } from "eve/memory/file";
import type { MemoryDocumentBackend } from "eve/memory/file";

/** An error with no useful message for the model or the audit log. */
function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function readRow(key: string) {
  const row = db
    .select({ content: memoryDocuments.content, version: memoryDocuments.version })
    .from(memoryDocuments)
    .where(eq(memoryDocuments.key, key))
    .get();
  return row ? { content: row.content, version: row.version } : null;
}

async function insertRow(key: string, content: string): Promise<boolean> {
  const now = Date.now();
  // changes is the conflict signal: 0 means ON CONFLICT DO NOTHING ignored
  // the insert (.returning() still yields a row for an ignored insert, so
  // row count is NOT reliable here).
  const inserted = db
    .insert(memoryDocuments)
    .values({ key, namespace: "", content, version: randomUUID(), createdAt: now, updatedAt: now })
    .onConflictDoNothing()
    .run();
  return inserted.changes > 0;
}

export const memorySqliteBackend: MemoryDocumentBackend = {
  async read({ key }) {
    try {
      return await readRow(key);
    } catch (err) {
      throw new Error(`memory backend read failed: ${messageOf(err)}`, { cause: err });
    }
  },

  async write({ key, content, expectedVersion }) {
    const now = Date.now();
    try {
      if (expectedVersion === null) {
        // Create-only: an existing row means a concurrent writer got there
        // first between our read and this write.
        if (!insertRow(key, content)) throw new MemoryDocumentConflictError(key);
      } else {
        // The WHERE carries the version: a stale expectedVersion updates
        // nothing (changes 0), which is the conflict the provider's retry
        // loop resolves by re-reading.
        const updated = db
          .update(memoryDocuments)
          .set({ content, version: randomUUID(), updatedAt: now })
          .where(and(eq(memoryDocuments.key, key), eq(memoryDocuments.version, expectedVersion)))
          .run();
        // A row deleted between read and write behaves like a conflict too:
        // create-only against a (re)appeared row also conflicts.
        if (updated.changes === 0 && !insertRow(key, content)) {
          throw new MemoryDocumentConflictError(key);
        }
      }
    } catch (err) {
      if (MemoryDocumentConflictError.is(err)) throw err;
      // A throwing tool fails the model's step; surface a short reason
      // instead of a driver stack trace.
      throw new Error(`memory backend write failed: ${messageOf(err)}`, { cause: err });
    }
    return (await readRow(key)) ?? { content, version: "" };
  },
};
