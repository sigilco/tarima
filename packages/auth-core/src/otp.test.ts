import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import {
  generateOtpCode,
  hashOtp,
  isOtpExpired,
  MAX_VERIFY_ATTEMPTS,
  otpExpiresAt,
  verifyOtp,
} from "./otp";

describe("generateOtpCode", () => {
  it("returns a 6-digit zero-padded string", () => {
    for (let i = 0; i < 100; i++) {
      const code = generateOtpCode();
      expect(code).toMatch(/^\d{6}$/);
    }
  });

  it("never collapses to a shorter string (padding is unconditional)", { timeout: 20_000 }, () => {
    // 100k draws is plenty to touch every short branch in [0, 99]; if the
    // padding were conditional any short code (e.g. "0" or "12") would
    // appear here.
    const seen = new Set<string>();
    for (let i = 0; i < 100_000; i++) seen.add(generateOtpCode());
    for (const code of seen) expect(code).toHaveLength(6);
    // Sanity: 100k draws should not all collide onto one value.
    expect(seen.size).toBeGreaterThan(50_000);
  });

  it("covers a wide range of values over many draws", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 5000; i++) seen.add(generateOtpCode());
    expect(seen.size).toBeGreaterThan(4000); // < 0.001% collision probability
  });

  it("first two-digit buckets are well-distributed (proxies CSPRNG randomness)", () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 1000; i++) {
      const bucket = generateOtpCode().slice(0, 2);
      counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
    }
    expect(counts.size).toBeGreaterThan(50);
  });
});

describe("hashOtp / verifyOtp", () => {
  it("round-trips through bcrypt", async () => {
    const code = generateOtpCode();
    const hash = hashOtp(code);
    expect(hash).not.toEqual(code);
    expect(hash.length).toBeGreaterThan(20);
    expect(await verifyOtp(code, hash)).toBe(true);
  });

  it("rejects a wrong code", async () => {
    const hash = hashOtp("123456");
    expect(await verifyOtp("654321", hash)).toBe(false);
  });

  it("two hashes of the same code differ (bcrypt salt)", () => {
    const code = "111111";
    expect(hashOtp(code)).not.toEqual(hashOtp(code));
  });

  it("a hash is not equal to the sha256 of the code (sanity)", () => {
    const code = "424242";
    const sha = createHash("sha256").update(code).digest("hex");
    expect(hashOtp(code)).not.toEqual(sha);
  });
});

describe("otpExpiresAt", () => {
  it("returns now + 5 minutes", () => {
    const now = 1_700_000_000_000;
    expect(otpExpiresAt(now).getTime()).toBe(now + 5 * 60 * 1000);
  });

  it("defaults to wall-clock now when called with no arg", () => {
    const before = Date.now();
    const expires = otpExpiresAt().getTime();
    const after = Date.now();
    expect(expires).toBeGreaterThanOrEqual(before + 5 * 60 * 1000 - 5);
    expect(expires).toBeLessThanOrEqual(after + 5 * 60 * 1000 + 5);
  });
});

describe("isOtpExpired", () => {
  it("is false before expiresAt and true at or after", () => {
    const expiresAt = new Date(1_700_000_300_000); // +5min
    expect(isOtpExpired({ expiresAt }, 1_700_000_299_999)).toBe(false);
    expect(isOtpExpired({ expiresAt }, 1_700_000_300_000)).toBe(true);
    expect(isOtpExpired({ expiresAt }, 1_700_000_300_001)).toBe(true);
  });
});

describe("MAX_VERIFY_ATTEMPTS", () => {
  it("is exactly 5", () => {
    expect(MAX_VERIFY_ATTEMPTS).toBe(5);
  });
});
