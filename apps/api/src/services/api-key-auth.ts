/**
 * Api-key verification for the deferred MCP surface.
 *
 * SP7 teardown: the `@tarima/api-keys` package and the bearer route
 * surface went away, but the MCP endpoint stays mounted (deferred), so
 * the verification path it needs is inlined here. The `api_keys` table
 * and the schema are unchanged.
 */
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { apiKeys } from "../db/schema";

/** Prefix every plaintext key carries so leaks are recognizable. */
const API_KEY_PREFIX = "tarima_";

/** Scrypt parameters: cheap enough for a login, expensive for a brute force. */
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 32 } as const;

/** Constant time compare of a candidate plaintext against a stored hash. */
function compareApiKey(plaintext: string, stored: string): boolean {
  const salt = stored.slice(0, 8);
  const expected = Buffer.from(stored.slice(9), "base64");
  const derived = scryptSync(plaintext, salt, expected.length, SCRYPT);
  return timingSafeEqual(derived, expected);
}

/**
 * Split `tarima_<prefix>_<secret>` into its parts. Returns null when the
 * shape is wrong; the prefix is the lookup key and must be url safe.
 */
function splitApiKey(plaintext: string): { prefix: string; secret: string } | null {
  const rest = plaintext.startsWith(API_KEY_PREFIX) ? plaintext.slice(API_KEY_PREFIX.length) : "";
  const parts = rest.split("_");
  if (parts.length !== 2) return null;
  const [prefix, secret] = parts;
  if (!/^[a-z0-9]{6}$/.test(prefix)) return null;
  if (!/^[a-z0-9]{20,}$/.test(secret)) return null;
  return { prefix, secret };
}

/** The Authorization bearer token of a request, or undefined. */
export function bearerToken(request: Request): string | undefined {
  const header = request.headers.get("Authorization") ?? request.headers.get("authorization");
  if (!header) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const token = match?.[1]?.trim();
  return token ? token : undefined;
}

/** Result of a successful verification. */
export interface VerifiedKey {
  userId: string;
  scopes: string[];
}

/**
 * Verify a plaintext key against the `api_keys` table. Returns null for
 * a malformed shape, an unknown prefix, a wrong secret, or a revoked key.
 */
export function verifyApiKey(plaintext: string): VerifiedKey | null {
  const parts = splitApiKey(plaintext);
  if (!parts) return null;
  const row = db.select().from(apiKeys).where(eq(apiKeys.prefix, parts.prefix)).get();
  if (!row || row.revokedAt !== null) return null;
  if (!compareApiKey(plaintext, row.keyHash)) return null;
  return { userId: row.userId, scopes: row.scopes ?? [] };
}

/** A freshly created api key: shown once, only the hash is stored. */
export interface CreatedApiKey {
  id: string;
  name: string;
  secret: string;
}

/**
 * Mint a new plaintext key, store its hash, return the secret. The
 * plaintext is `tarima_<prefix>_<secret>`; the prefix is the lookup key.
 */
export function createApiKeyForUser(userId: string, name: string, scopes: string[]): CreatedApiKey {
  const id = randomUUID();
  const prefix = randomBytes(3).toString("hex");
  const secret = randomBytes(20).toString("hex");
  const salt = randomBytes(4).toString("hex");
  const plaintext = `${API_KEY_PREFIX}${prefix}_${secret}`;
  const derived = scryptSync(plaintext, salt, 32, SCRYPT);
  const keyHash = `${salt}:${derived.toString("base64")}`;
  db.insert(apiKeys).values({ id, userId, name, prefix, keyHash, scopes }).run();
  return { id, name, secret: plaintext };
}
