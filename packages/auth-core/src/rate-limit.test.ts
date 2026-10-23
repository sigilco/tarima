import { afterEach, describe, expect, it } from "vitest";
import {
  checkFailedVerify,
  checkRequestOtp,
  recordFailedVerify,
  recordRequestOtp,
  _resetRateLimitsForTests,
} from "./rate-limit";

const NOW = 1_700_000_000_000; // fixed clock for deterministic assertions

afterEach(() => {
  _resetRateLimitsForTests();
});

describe("checkRequestOtp", () => {
  it("allows the first request for a fresh email/ip", () => {
    const r = checkRequestOtp("a@example.com", "1.2.3.4", NOW);
    expect(r).toEqual({ ok: true });
  });

  it("rejects during the 30s cooldown even when below the hourly cap", () => {
    recordRequestOtp("a@example.com", "1.2.3.4", NOW);
    expect(checkRequestOtp("a@example.com", "1.2.3.4", NOW)).toEqual({
      ok: false,
      retryAfter: 30,
    });
    expect(checkRequestOtp("a@example.com", "1.2.3.4", NOW + 10_000)).toEqual({
      ok: false,
      retryAfter: 20,
    });
    expect(checkRequestOtp("a@example.com", "1.2.3.4", NOW + 31_000)).toEqual({
      ok: true,
    });
  });

  it("rejects when the per-email hourly cap is reached", () => {
    recordRequestOtp("a@example.com", undefined, NOW);
    recordRequestOtp("a@example.com", undefined, NOW + 31_000);
    recordRequestOtp("a@example.com", undefined, NOW + 62_000);
    // After 3 records, the 4th call hits the cap.
    const r = checkRequestOtp("a@example.com", undefined, NOW + 93_000);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.retryAfter).toBeGreaterThan(0);
  });

  it("rejects when the per-IP hourly cap is reached but a different email is fine", () => {
    // Drive the IP counter to the cap with a unique email each call (one
    // per 31s so cooldown doesn't interfere).
    const labels = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];
    for (let i = 0; i < labels.length; i++) {
      recordRequestOtp(`${labels[i]}@example.com`, "1.2.3.4", NOW + i * 31_000);
    }
    // 11th attempt (from a never-seen email) for the same IP must be blocked
    // by the IP cap, not by email cooldown.
    const r = checkRequestOtp("never@example.com", "1.2.3.4", NOW + 10 * 31_000);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.retryAfter).toBeGreaterThan(0);
  });

  it("rejects neither email nor IP when both below their limits", () => {
    recordRequestOtp("a@example.com", "1.2.3.4", NOW);
    expect(checkRequestOtp("b@example.com", "5.6.7.8", NOW + 31_000).ok).toBe(true);
  });

  it("does not bump counters when the limiter rejects the call", () => {
    expect(checkRequestOtp("a@example.com", "1.2.3.4", NOW).ok).toBe(true);
    // Drive to the cap with the same email.
    recordRequestOtp("a@example.com", "1.2.3.4", NOW);
    recordRequestOtp("a@example.com", "1.2.3.4", NOW + 31_000);
    recordRequestOtp("a@example.com", "1.2.3.4", NOW + 62_000);
    // Reject call must not increment the IP counter.
    const blocked = checkRequestOtp("a@example.com", "1.2.3.4", NOW + 93_000);
    expect(blocked.ok).toBe(false);
    // A new email for the same IP should still be 1/10 — IP counter wasn't bumped by rejected calls.
    const fresh = checkRequestOtp("different@example.com", "1.2.3.4", NOW + 93_000);
    expect(fresh).toEqual({ ok: true });
  });

  it("bypasses the per-IP check when no IP is provided", () => {
    recordRequestOtp("a@example.com", undefined, NOW);
    recordRequestOtp("b@example.com", undefined, NOW + 31_000);
    recordRequestOtp("c@example.com", undefined, NOW + 62_000);
    recordRequestOtp("d@example.com", undefined, NOW + 93_000);
    recordRequestOtp("e@example.com", undefined, NOW + 124_000);
    recordRequestOtp("f@example.com", undefined, NOW + 155_000);
    recordRequestOtp("g@example.com", undefined, NOW + 186_000);
    recordRequestOtp("h@example.com", undefined, NOW + 217_000);
    recordRequestOtp("i@example.com", undefined, NOW + 248_000);
    recordRequestOtp("j@example.com", undefined, NOW + 279_000);
    // Email "never" still allowed at this point (no email-level record for it).
    const r = checkRequestOtp("never@example.com", undefined, NOW + 310_000);
    expect(r.ok).toBe(true);
  });
});

describe("checkFailedVerify / recordFailedVerify", () => {
  it("starts open", () => {
    expect(checkFailedVerify("a@example.com", NOW)).toEqual({ ok: true });
  });

  it("locks after 10 failures within 24h, surfacing retryAfter", () => {
    for (let i = 0; i < 10; i++) recordFailedVerify("a@example.com", NOW + i * 1000);
    const r = checkFailedVerify("a@example.com", NOW + 9_000);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.retryAfter).toBeGreaterThan(0);
  });

  it("a successful verify does NOT bump the failed counter", () => {
    for (let i = 0; i < 9; i++) recordFailedVerify("a@example.com", NOW + i * 1000);
    // Simulating "ok" — we just don't call recordFailedVerify.
    expect(checkFailedVerify("a@example.com", NOW + 9_000).ok).toBe(true);
  });

  it("resets when the window expires", () => {
    for (let i = 0; i < 10; i++) recordFailedVerify("a@example.com", NOW + i * 1000);
    expect(checkFailedVerify("a@example.com", NOW + 24 * 60 * 60 * 1000).ok).toBe(true);
  });
});

describe("_resetRateLimitsForTests", () => {
  it("clears every map", () => {
    recordRequestOtp("a@example.com", "1.2.3.4", NOW);
    recordFailedVerify("a@example.com", NOW);
    _resetRateLimitsForTests();
    expect(checkRequestOtp("a@example.com", "1.2.3.4", NOW)).toEqual({ ok: true });
    expect(checkFailedVerify("a@example.com", NOW)).toEqual({ ok: true });
  });
});
