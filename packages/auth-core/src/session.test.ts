import { describe, expect, it } from "vitest";
import {
  clearSessionCookieHeader,
  createSessionToken,
  readSessionCookie,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  sessionCookieHeader,
  verifySessionToken,
} from "./session";

const SECRET = "test-secret-32-chars-long-aaaaaa";
const NOW = 1_700_000_000_000;

describe("createSessionToken", () => {
  it("signs a <userId>.<expiresAt>.<hmac> tuple", () => {
    const userId = "user-1";
    const token = createSessionToken(userId, SECRET, SESSION_TTL_SECONDS, NOW);
    const parts = token.split(".");
    expect(parts).toHaveLength(3);
    expect(parts[0]).toBe(userId);
    const expires = Number.parseInt(parts[1]!, 10);
    expect(expires).toBe(Math.floor(NOW / 1000) + SESSION_TTL_SECONDS);
    expect(parts[2]).toMatch(/^[a-f0-9]{64}$/);
  });

  it("expires_at changes with `now` and ttl", () => {
    const t1 = createSessionToken("u", SECRET, 60, NOW);
    const t2 = createSessionToken("u", SECRET, 120, NOW);
    const t3 = createSessionToken("u", SECRET, 60, NOW + 1000);
    expect(t1.split(".")[1]).not.toBe(t2.split(".")[1]);
    expect(t1.split(".")[1]).not.toBe(t3.split(".")[1]);
  });

  it("a different secret produces a different signature", () => {
    const a = createSessionToken("u", SECRET, 60, NOW);
    const b = createSessionToken("u", "different-secret-32-chars-aaa", 60, NOW);
    expect(a).not.toBe(b);
  });
});

describe("verifySessionToken", () => {
  it("returns userId + expiresAt on a fresh, correctly-signed token", () => {
    const token = createSessionToken("user-1", SECRET, SESSION_TTL_SECONDS, NOW);
    const r = verifySessionToken(token, SECRET, NOW + 1000);
    expect(r).toEqual({
      userId: "user-1",
      expiresAt: Math.floor(NOW / 1000) + SESSION_TTL_SECONDS,
    });
  });

  it("rejects an expired token (now exactly at expiresAt)", () => {
    const ttl = 60;
    const token = createSessionToken("u", SECRET, ttl, NOW);
    expect(verifySessionToken(token, SECRET, NOW + ttl * 1000)).toBeUndefined();
    expect(verifySessionToken(token, SECRET, NOW + (ttl + 1) * 1000)).toBeUndefined();
  });

  it("rejects a token signed with the wrong secret", () => {
    const token = createSessionToken("u", SECRET, 60, NOW);
    expect(verifySessionToken(token, "wrong-secret-32-chars-long-aa", NOW)).toBeUndefined();
  });

  it("rejects a tampered userId segment", () => {
    const token = createSessionToken("user-1", SECRET, 60, NOW);
    const tampered = `user-X.${token.split(".")[1]}.${token.split(".")[2]}`;
    expect(verifySessionToken(tampered, SECRET, NOW)).toBeUndefined();
  });

  it("rejects a tampered signature segment (different length)", () => {
    const token = createSessionToken("u", SECRET, 60, NOW);
    const tampered = `${token.split(".")[0]}.${token.split(".")[1]}.abcd`;
    expect(verifySessionToken(tampered, SECRET, NOW)).toBeUndefined();
  });

  it("rejects a tampered signature segment (same length, wrong content)", () => {
    const token = createSessionToken("u", SECRET, 60, NOW);
    const sig = token.split(".")[2]!;
    const flipped = sig
      .split("")
      .map((c, i) => (i === 0 ? (c === "0" ? "1" : "0") : c))
      .join("");
    const tampered = `${token.split(".")[0]}.${token.split(".")[1]}.${flipped}`;
    expect(verifySessionToken(tampered, SECRET, NOW)).toBeUndefined();
  });

  it("rejects malformed inputs", () => {
    for (const bad of ["", null, undefined, "no-dots", "a.b", "a.b.c.d", "..", "a..b"]) {
      expect(verifySessionToken(bad, SECRET, NOW)).toBeUndefined();
    }
  });

  it("rejects a token whose expiresAt is not a number", () => {
    const token = `user-1.notanumber.${createSessionToken("user-1", SECRET, 60, NOW).split(".")[2]}`;
    expect(verifySessionToken(token, SECRET, NOW)).toBeUndefined();
  });
});

describe("sessionCookieHeader", () => {
  it("includes all spec attributes in production", () => {
    const header = sessionCookieHeader("abc", true);
    expect(header).toContain(`${SESSION_COOKIE}=abc`);
    expect(header).toContain("HttpOnly");
    expect(header).toContain("Secure");
    expect(header).toContain("SameSite=Lax");
    expect(header).toContain("Path=/");
    expect(header).toContain(`Max-Age=${SESSION_TTL_SECONDS}`);
  });

  it("drops Secure outside production (so http://localhost works)", () => {
    const header = sessionCookieHeader("abc", false);
    expect(header).toContain("HttpOnly");
    expect(header).not.toContain("Secure;");
    expect(header).toContain("SameSite=Lax");
    expect(header).toContain("Path=/");
  });

  it("honors a custom Max-Age", () => {
    const header = sessionCookieHeader("abc", true, 60);
    expect(header).toContain("Max-Age=60");
  });
});

describe("clearSessionCookieHeader", () => {
  it("returns a Max-Age=0 cookie with the same other attrs", () => {
    const header = clearSessionCookieHeader(true);
    expect(header).toContain(`${SESSION_COOKIE}=`);
    expect(header).toContain("HttpOnly");
    expect(header).toContain("Secure;");
    expect(header).toContain("SameSite=Lax");
    expect(header).toContain("Path=/");
    expect(header).toContain("Max-Age=0");
  });

  it("drops Secure in dev like the setter", () => {
    const header = clearSessionCookieHeader(false);
    expect(header).not.toContain("Secure;");
  });
});

describe("readSessionCookie", () => {
  it("parses the cookie out of a Cookie header", () => {
    const req = new Request("https://example.com", {
      headers: { Cookie: `${SESSION_COOKIE}=abc; other=zzz` },
    });
    expect(readSessionCookie(req)).toBe("abc");
  });

  it("returns undefined when absent", () => {
    const req = new Request("https://example.com");
    expect(readSessionCookie(req)).toBeUndefined();
  });

  it("preserves values containing dots", () => {
    const req = new Request("https://example.com", {
      headers: { Cookie: `${SESSION_COOKIE}=user-1.1700000000.deadbeef` },
    });
    expect(readSessionCookie(req)).toBe("user-1.1700000000.deadbeef");
  });
});
