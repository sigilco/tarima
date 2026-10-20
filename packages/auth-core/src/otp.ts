import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";

/**
 * OTP generation + hashing helpers (pure; no I/O).
 *
 * bcrypt rounds = 10: matches the spec's "10 rounds" recommendation and
 * stays under ~50ms per hash on commodity hardware. The verify path's
 * bcrypt.compare is constant-time, so timingSafeEqual is not layered on
 * top. The HMAC session token is the only place timingSafeEqual runs.
 */
const BCRYPT_ROUNDS = 10;
const OTP_TTL_MS = 5 * 60 * 1000;

/**
 * Maximum failed verify attempts before the OTP row is burned. The api
 * holds this constant and bumps `attempts` on each unsuccessful compare;
 * once attempts > MAX_VERIFY_ATTEMPTS the row is marked consumed so the
 * caller must re-request a code.
 */
export const MAX_VERIFY_ATTEMPTS = 5;

/**
 * Shape of the otp_codes table row as the api writes/reads it. Keeping
 * the type here lets the api route helpers import without depending on
 * the db schema (and keeps test fixtures trivial).
 */
export interface OtpRow {
  id: string;
  email: string;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
}

/** Generate a 6-digit OTP as a zero-padded string ("000123"). */
export function generateOtpCode(): string {
  // randomInt is from node:crypto (CSPRNG); padStart ensures leading zeros
  // (randomInt can return 0 → "0" otherwise, the user would see "0" or
  // "023" depending on luck).
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** bcrypt-hash the OTP before insert. Never store plaintext. */
export function hashOtp(code: string): string {
  return bcrypt.hashSync(code, BCRYPT_ROUNDS);
}

/** Constant-time compare against a stored hash. */
export async function verifyOtp(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

/** Returns a Date 5 minutes from now — the row's expires_at. */
export function otpExpiresAt(now: number = Date.now()): Date {
  return new Date(now + OTP_TTL_MS);
}

/** True when the row's `now >= expiresAt`. */
export function isOtpExpired(row: OtpRow | { expiresAt: Date }, now: number = Date.now()): boolean {
  return row.expiresAt.getTime() <= now;
}
