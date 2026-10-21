/**
 * Api key lifecycle for the api app: mint a key for a user, persist only the
 * hash, and list keys without ever leaking a secret.
 */
import { generateApiKey, type ApiKeyRecord } from "@tarima/api-keys";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../db/schema";
import { createDbApiKeyStore } from "./api-key-store";

type ApiDb = BetterSQLite3Database<typeof schema>;

export interface CreatedApiKey {
  /** Shown once. Never persisted, never returned again. */
  secret: string;
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: number;
}

/** Public view of a key: no hash, no secret. */
export interface ApiKeySummary {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: number;
  revokedAt: number | null;
}

/**
 * Mint a key for `userId`. Returns the plaintext once: the caller must hand
 * it to the user and never log or persist it.
 */
export function createApiKeyForUser(
  db: ApiDb,
  userId: string,
  name: string,
  scopes: string[],
): CreatedApiKey {
  const { plaintext, record } = generateApiKey(userId, name, scopes);
  createDbApiKeyStore(db).insert(record);
  return {
    secret: plaintext,
    id: record.id,
    name: record.name,
    prefix: record.prefix,
    scopes: record.scopes,
    createdAt: record.createdAt,
  };
}

/** All keys owned by a user, newest first. Hashes never leave this module. */
export function listApiKeysForUser(db: ApiDb, userId: string): ApiKeySummary[] {
  const store = createDbApiKeyStore(db);
  const rows: ApiKeyRecord[] = store.listForUser(userId);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    prefix: row.prefix,
    scopes: row.scopes,
    createdAt: row.createdAt,
    revokedAt: row.revokedAt,
  }));
}

/** Revoke a key owned by `userId`. Returns false when no such key exists. */
export function revokeApiKey(db: ApiDb, userId: string, id: string): boolean {
  const store = createDbApiKeyStore(db);
  const owned = store.listForUser(userId).find((row) => row.id === id && row.revokedAt === null);
  if (!owned) return false;
  store.revoke(id, Date.now());
  return true;
}
