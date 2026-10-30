/**
 * Connect codes (Stage B, channels stream).
 *
 * A connect code is the one-time secret a tester sends to a bot to bind
 * a channel to their account:
 *
 *   1. the settings page mints a 6-char code for one channel
 *      (`POST /api/ui/settings/connect-code`, channel in the body)
 *   2. the tester sends `/start ABC123` to the Telegram bot or any
 *      message to the WhatsApp number
 *   3. the webhook resolves the code, writes the `channel_bindings`
 *      row and confirms in-chat
 *
 * Codes are stored hashed (sha256), expire after
 * `CONNECT_CODE_TTL_SEC` (15 min, the contract freeze) and are single
 * use: the consuming webhook marks the row consumed and the lookup
 * never returns it again. Codes are generated from an unambiguous
 * alphabet (no 0/O, 1/I/L) so they can be read off a phone screen and
 * typed into a chat without mistakes.
 */
import { createHash, randomUUID } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { CONNECT_CODE_TTL_SEC } from "@tarima/contract";
import type { ApiDb } from "./projects";
import { connectCodes } from "../db/schema";

/** Alphabet without lookalike characters (no 0/O, 1/I/L). */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** How long a code stays valid, from the contract freeze. */
export const CODE_TTL_MS = CONNECT_CODE_TTL_SEC * 1000;

/** The wire shape of a freshly minted code (plaintext, shown once). */
export interface CreatedConnectCode {
  /** ISO 8601; the settings page shows it as the countdown. */
  expiresAt: string;
  code: string;
}

/** sha256 hex of a code, the only form the db keeps. */
export function hashCode(code: string): string {
  return createHash("sha256").update(code, "utf8").digest("hex");
}

/**
 * Mint a code for `userId` + `channel`. Any number of unconsumed codes
 * may exist at once; a stale one simply expires.
 */
export function createConnectCode(
  db: ApiDb,
  userId: string,
  channel: "telegram" | "whatsapp",
): CreatedConnectCode {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]!;
  }

  const expiresAt = Date.now() + CODE_TTL_MS;
  db.insert(connectCodes)
    .values({
      id: randomUUID(),
      userId,
      channel,
      codeHash: hashCode(code),
      expiresAt,
    })
    .run();

  return { code, expiresAt: new Date(expiresAt).toISOString() };
}

/** The outcome of resolving a code against an inbound message. */
export type ResolveCodeResult = { ok: true; userId: string } | { ok: false; reason: "invalid" };

/**
 * Resolve a code a bot received. Consumes the code on success: the row
 * is marked consumed and cannot be resolved again (single use). Unknown,
 * expired and already-consumed codes all collapse into `invalid`, so an
 * attacker learns nothing from the error text.
 */
export function resolveConnectCode(
  db: ApiDb,
  channel: "telegram" | "whatsapp",
  rawCode: string,
): ResolveCodeResult {
  const code = rawCode.trim().toUpperCase();
  const now = Date.now();
  const row = db
    .select()
    .from(connectCodes)
    .where(
      and(
        eq(connectCodes.codeHash, hashCode(code)),
        eq(connectCodes.channel, channel),
        isNull(connectCodes.consumedAt),
        gt(connectCodes.expiresAt, now),
      ),
    )
    .get();

  if (!row) return { ok: false, reason: "invalid" };

  db.update(connectCodes).set({ consumedAt: now }).where(eq(connectCodes.id, row.id)).run();

  return { ok: true, userId: row.userId };
}
