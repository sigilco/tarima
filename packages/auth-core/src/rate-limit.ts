/**
 * Rate limiting for the OTP request and failed-verify endpoints — three
 * in-memory maps with fixed (non-rolling) windows:
 *
 *   - request_by_email: 3 requests / hour + 30s cooldown between any two.
 *   - request_by_ip:    10 requests / hour.
 *   - failed_verify_by_email: 10 failures / 24hr → lockout.
 *
 * The window is fixed, not rolling: a counter resets when
 * `now - windowStart >= windowMs`, so a quiet hour empties the bucket.
 * Fixed windows are cheaper than rolling and read naturally as the
 * "3/hr" + "10/24hr" the rest of the system talks about.
 *
 * ponytail: keys are prefixed (`email:`, `ip:`, `fail:`) so the three
 * Maps can live in a single Map<string, Entry> if they ever need to
 * share a memory ceiling or get compacted by LRU. The current split
 * keeps each Map's semantics independent.
 */

const REQUEST_PER_EMAIL_LIMIT = 3;
const REQUEST_PER_EMAIL_WINDOW_MS = 60 * 60 * 1000;
const REQUEST_PER_EMAIL_COOLDOWN_MS = 30 * 1000;
const REQUEST_PER_IP_LIMIT = 10;
const REQUEST_PER_IP_WINDOW_MS = 60 * 60 * 1000;
const FAILED_VERIFY_LIMIT = 10;
const FAILED_VERIFY_WINDOW_MS = 24 * 60 * 60 * 1000;

interface Entry {
  count: number;
  windowStart: number;
  /** Email-request map only: tracks the most recent send for cooldown. */
  lastRequestAt?: number;
}

const requestByEmail = new Map<string, Entry>();
const requestByIp = new Map<string, Entry>();
const failedVerifyByEmail = new Map<string, Entry>();

function getOrCreate(
  map: Map<string, Entry>,
  key: string,
  windowMs: number,
  now: number,
): { entry: Entry; expired: boolean } {
  const existing = map.get(key);
  if (!existing || now - existing.windowStart >= windowMs) {
    const entry: Entry = { count: 0, windowStart: now };
    map.set(key, entry);
    return { entry, expired: true };
  }
  return { entry: existing, expired: false };
}

function retryAfterSeconds(windowStart: number, windowMs: number, now: number): number {
  const remaining = windowMs - (now - windowStart);
  // Math.max(1, ...) so a Retry-After of 0 (window about to expire mid-handler)
  // never tells the client "retry now" when the request hasn't been recorded yet.
  return Math.max(1, Math.ceil(remaining / 1000));
}

export type RateLimitOk = { ok: true };
export type RateLimitLimited = { ok: false; retryAfter: number };
export type RateLimitResult = RateLimitOk | RateLimitLimited;

/**
 * Read-only check: would `requestOtp` for this email/ip be allowed right now?
 * Resolution order is cooldown → per-email cap → per-IP cap. Each rejection
 * surfaces the seconds until the relevant window resets.
 */
export function checkRequestOtp(
  email: string,
  ip: string | undefined,
  now: number = Date.now(),
): RateLimitResult {
  const emailKey = `email:${email}`;
  const existing = requestByEmail.get(emailKey);

  // Cooldown first — the 30s gap is the cheapest first-line defence.
  if (existing?.lastRequestAt) {
    const since = now - existing.lastRequestAt;
    if (since < REQUEST_PER_EMAIL_COOLDOWN_MS) {
      return {
        ok: false,
        retryAfter: Math.max(1, Math.ceil((REQUEST_PER_EMAIL_COOLDOWN_MS - since) / 1000)),
      };
    }
  }

  // Per-email hourly cap.
  const { entry: emailEntry } = getOrCreate(
    requestByEmail,
    emailKey,
    REQUEST_PER_EMAIL_WINDOW_MS,
    now,
  );
  if (emailEntry.count >= REQUEST_PER_EMAIL_LIMIT) {
    return {
      ok: false,
      retryAfter: retryAfterSeconds(emailEntry.windowStart, REQUEST_PER_EMAIL_WINDOW_MS, now),
    };
  }

  // Per-IP hourly cap. Absent IP bypasses — the spec doesn't fail-closed
  // on missing X-Forwarded-For; the api surfaces its own log line for it.
  if (ip) {
    const { entry: ipEntry } = getOrCreate(requestByIp, `ip:${ip}`, REQUEST_PER_IP_WINDOW_MS, now);
    if (ipEntry.count >= REQUEST_PER_IP_LIMIT) {
      return {
        ok: false,
        retryAfter: retryAfterSeconds(ipEntry.windowStart, REQUEST_PER_IP_WINDOW_MS, now),
      };
    }
  }

  return { ok: true };
}

/**
 * Bump the per-email + per-IP request counters. Called from the api
 * AFTER a successful request-otp pass — NOT when the limiter itself rejects.
 */
export function recordRequestOtp(
  email: string,
  ip: string | undefined,
  now: number = Date.now(),
): void {
  const { entry: emailEntry } = getOrCreate(
    requestByEmail,
    `email:${email}`,
    REQUEST_PER_EMAIL_WINDOW_MS,
    now,
  );
  emailEntry.count++;
  emailEntry.lastRequestAt = now;

  if (ip) {
    const { entry: ipEntry } = getOrCreate(requestByIp, `ip:${ip}`, REQUEST_PER_IP_WINDOW_MS, now);
    ipEntry.count++;
  }
}

/** True while the email is below the failed-verify cap for the current window. */
export function checkFailedVerify(email: string, now: number = Date.now()): RateLimitResult {
  const key = `fail:${email}`;
  const existing = failedVerifyByEmail.get(key);
  if (!existing) return { ok: true };

  if (now - existing.windowStart >= FAILED_VERIFY_WINDOW_MS) {
    failedVerifyByEmail.delete(key);
    return { ok: true };
  }

  if (existing.count >= FAILED_VERIFY_LIMIT) {
    return {
      ok: false,
      retryAfter: retryAfterSeconds(existing.windowStart, FAILED_VERIFY_WINDOW_MS, now),
    };
  }
  return { ok: true };
}

/** Bump the failed-verify counter. Called on invalid_code / invalid_or_expired
 *  / too_many_attempts — NOT on success. */
export function recordFailedVerify(email: string, now: number = Date.now()): void {
  const { entry } = getOrCreate(failedVerifyByEmail, `fail:${email}`, FAILED_VERIFY_WINDOW_MS, now);
  entry.count++;
}

/** Test-only seam: drop all in-memory limiter state. */
export function _resetRateLimitsForTests(): void {
  requestByEmail.clear();
  requestByIp.clear();
  failedVerifyByEmail.clear();
}
