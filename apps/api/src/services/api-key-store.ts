/**
 * Drizzle binding of the `@tarima/api-keys` storage seam to the `api_keys`
 * table. The package owns the semantics (hashing, verification); this
 * module owns the SQL.
 */
import { desc, eq } from "drizzle-orm";
import type { ApiKeyRecord, ApiKeyStore } from "@tarima/api-keys";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { apiKeys } from "../db/schema";

type ApiDb = BetterSQLite3Database<typeof import("../db/schema")>;

function toRecord(row: typeof apiKeys.$inferSelect): ApiKeyRecord {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    prefix: row.prefix,
    keyHash: row.keyHash,
    scopes: row.scopes ?? [],
    revokedAt: row.revokedAt,
    createdAt: row.createdAt,
  };
}

/** Bind the key store to a drizzle database. */
export function createDbApiKeyStore(db: ApiDb): ApiKeyStore {
  return {
    insert(record) {
      db.insert(apiKeys)
        .values({
          id: record.id,
          userId: record.userId,
          name: record.name,
          prefix: record.prefix,
          keyHash: record.keyHash,
          scopes: record.scopes,
          createdAt: record.createdAt,
          revokedAt: record.revokedAt,
        })
        .run();
    },
    findByPrefix(prefix) {
      const row = db.select().from(apiKeys).where(eq(apiKeys.prefix, prefix)).get();
      return row ? toRecord(row) : undefined;
    },
    listForUser(userId) {
      return db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.userId, userId))
        .orderBy(desc(apiKeys.createdAt))
        .all()
        .map(toRecord);
    },
    revoke(id, revokedAt) {
      db.update(apiKeys).set({ revokedAt }).where(eq(apiKeys.id, id)).run();
    },
  };
}
