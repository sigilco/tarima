import { compareApiKey, splitApiKey, type ApiKeyRecord } from "./keys.js";

/**
 * Storage seam for api keys. The api binds this to the `api_keys` table;
 * tests bind it to a Map. All methods are synchronous because better-sqlite3
 * is synchronous and the api already treats the db that way.
 */
export interface ApiKeyStore {
  insert(record: ApiKeyRecord): void;
  findByPrefix(prefix: string): ApiKeyRecord | undefined;
  listForUser(userId: string): ApiKeyRecord[];
  revoke(id: string, revokedAt: number): void;
}

/** Result of a successful verification. */
export interface VerifiedKey {
  userId: string;
  scopes: string[];
}

/**
 * Verify a plaintext key against the store. Returns null for a malformed
 * shape, an unknown prefix, a wrong secret, or a revoked key.
 */
export function verifyApiKey(store: ApiKeyStore, plaintext: string): VerifiedKey | null {
  const parts = splitApiKey(plaintext);
  if (!parts) return null;
  const record = store.findByPrefix(parts.prefix);
  if (!record || record.revokedAt !== null) return null;
  if (!compareApiKey(plaintext, record.keyHash)) return null;
  return { userId: record.userId, scopes: record.scopes };
}

/** In-memory store for tests and for wiring before the db lands. */
export function createMemoryStore(): ApiKeyStore {
  const records = new Map<string, ApiKeyRecord>();
  return {
    insert(record) {
      records.set(record.id, record);
    },
    findByPrefix(prefix) {
      for (const record of records.values()) if (record.prefix === prefix) return record;
      return undefined;
    },
    listForUser(userId) {
      return [...records.values()].filter((record) => record.userId === userId);
    },
    revoke(id, revokedAt) {
      const record = records.get(id);
      if (record) records.set(id, { ...record, revokedAt });
    },
  };
}

/** Kept for symmetry with the package barrel; the api supplies the real store. */
export function createKeyStore(): ApiKeyStore {
  return createMemoryStore();
}
