import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/** Prefix every plaintext key carries so leaks are recognizable. */
export const API_KEY_PREFIX = "tarima_";

/** Shape the api persists for every key. Only the hash is verifiable. */
export interface ApiKeyRecord {
  id: string;
  userId: string;
  name: string;
  prefix: string;
  keyHash: string;
  scopes: string[];
  revokedAt: number | null;
  createdAt: number;
}

/** Scrypt parameters: cheap enough for a login, expensive for a brute force. */
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 32 } as const;

export function hashApiKey(plaintext: string): string {
  const salt = plaintext.slice(-8);
  const derived = scryptSync(plaintext, salt, SCRYPT.keylen, SCRYPT);
  return `${salt}:${derived.toString("base64")}`;
}

/** Constant time compare of a candidate plaintext against a stored hash. */
export function compareApiKey(plaintext: string, stored: string): boolean {
  const salt = stored.slice(0, 8);
  const expected = Buffer.from(stored.slice(9), "base64");
  const derived = scryptSync(plaintext, salt, expected.length, SCRYPT);
  return timingSafeEqual(derived, expected);
}

/**
 * Split `tarima_<prefix>_<secret>` into its parts. Returns null when the
 * shape is wrong; the prefix is the lookup key and must be url safe.
 */
export function splitApiKey(plaintext: string): { prefix: string; secret: string } | null {
  const rest = plaintext.startsWith(API_KEY_PREFIX) ? plaintext.slice(API_KEY_PREFIX.length) : "";
  const parts = rest.split("_");
  if (parts.length !== 2) return null;
  const [prefix, secret] = parts;
  if (!/^[a-z0-9]{6}$/.test(prefix)) return null;
  if (!/^[a-z0-9]{20,}$/.test(secret)) return null;
  return { prefix, secret };
}

/** True when the plaintext looks like one of our keys (shape only). */
export function verifyApiKeyFormat(plaintext: string): boolean {
  return splitApiKey(plaintext) !== null;
}

/** Generate the plaintext plus the values to persist. Display prefix only. */
export function generateApiKey(
  userId: string,
  name: string,
  scopes: string[],
  now: number = Date.now(),
): { plaintext: string; record: Omit<ApiKeyRecord, "id"> & { id: string } } {
  const prefix = randomBytes(3).toString("hex");
  const secret = randomBytes(16).toString("hex");
  const plaintext = `${API_KEY_PREFIX}${prefix}_${secret}`;
  const id = randomBytes(12).toString("hex");
  return {
    plaintext,
    record: {
      id,
      userId,
      name,
      prefix,
      keyHash: hashApiKey(plaintext),
      scopes,
      revokedAt: null,
      createdAt: now,
    },
  };
}
