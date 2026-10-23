# @tarima/auth-core

Pure helpers for the stage-3 OTP auth flow: CSPRNG + bcrypt + TTL on the OTP,
in-memory rate limiting on request-otp and failed-verify, and a stateless
HMAC-SHA256 session cookie format.

## Rules

- MUST stay pure: no I/O, no `process.env`, no app imports, no logger calls,
  no clock reads hidden in defaults — every helper takes the dependencies it
  needs (`now`, `secret`, ...). This is what makes the package unit-testable
  with vitest and lets the api app wire env-derived config at the boundary.
- NEVER import from `@tarima/contract`, `@tarima/obs`, the api app, or any
  database/drizzle code. Auth-core is a leaf alongside `@tarima/contract`.
- Rate-limit state is intentionally in-memory (`Map`). It resets on server
  restart and does not share across instances. Acceptable for the single
  instance the api currently runs as; the same `Map` can be swapped for a
  Turso-backed counter when that changes without touching call-sites.
- bcryptjs rounds = 10: matches "10 rounds" recommendation and stays under
  ~50ms per hash on commodity hardware. Round count is a const inside otp.ts
  — bump it in one place if a future deployment needs to harden it.
- HMAC compare uses `timingSafeEqual` after an explicit length short-circuit
  (timingSafeEqual throws on length mismatch).
- Default TTLs: OTP 5 minutes (`OTP_TTL_MS`), session 24h
  (`SESSION_TTL_SECONDS`). The session cookie's `Secure` attribute is gated
  by the caller's `isProduction` boolean so the package stays env-free.

## Exports

- `./otp`: `generateOtpCode`, `hashOtp`, `verifyOtp`, `otpExpiresAt`,
  `MAX_VERIFY_ATTEMPTS`, and the small `OtpRow` shape used by the api table.
- `./rate-limit`: `checkRequestOtp`, `recordRequestOtp`, `checkFailedVerify`,
  `recordFailedVerify`, `_resetRateLimitsForTests`.
- `./session`: `SESSION_COOKIE`, `SESSION_TTL_SECONDS`, `createSessionToken`,
  `verifySessionToken`, `sessionCookieHeader`, `clearSessionCookieHeader`,
  `readSessionCookie`.

## Testing

Vitest, catalog version. Tests live next to the code as `*.test.ts`. Cover:

- CSPRNG digit shape and padStart behavior on the 0 boundary.
- bcrypt round-trip including wrong-code rejection.
- expires_at = now + 5min.
- rate-limit cooldown (30s), per-email cap (3/hr), per-IP cap (10/hr),
  failed-verify lockout (10/24h) and the locked-out branch's retryAfter.
- session create/verify/expired/tampered, cookie attrs on prod vs dev,
  clear-cookie header.
