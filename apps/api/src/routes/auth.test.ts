import { mkdtempSync, rmSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "tarima-auth-"));
process.env.DATABASE_URL = join(dir, "test.db");
process.env.EMAIL_LOOPBACK_DOMAINS = "tarima.test";
process.env.NODE_ENV = "test";
delete process.env.BREVO_API_KEY;

const { authRoutes } = await import("./auth");
const { _resetRateLimitsForTests } = await import("@tarima/auth-core/rate-limit");

const EMAIL = "agent@tarima.test";
const json = (body: unknown) => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

/**
 * Issue a code and read it back out of the loopback inbox (newest first).
 * Fails loudly if the request was rate limited, so a test can never
 * mistake a re-read of the previous code for a freshly issued one.
 */
async function issueCode(email: string = EMAIL): Promise<string> {
  const issued = await authRoutes.request("/auth/request-otp", json({ email }));
  if (issued.status !== 200) {
    throw new Error(`request-otp was rejected with ${issued.status}`);
  }
  const res = await authRoutes.request(`/internal/admin/inbox?to=${email}`);
  const data = (await res.json()) as { messages: { otp: string | null }[] };
  const code = data.messages[0]?.otp;
  if (!code) throw new Error("no otp captured in loopback inbox");
  return code;
}

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("otp auth", () => {
  it("signs in end to end and sets a session cookie", async () => {
    _resetRateLimitsForTests();
    const code = await issueCode();

    const res = await authRoutes.request("/auth/verify-otp", json({ email: EMAIL, code }));
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("tarima_session=");
    expect(setCookie).toContain("HttpOnly");
  });

  it("rejects a wrong code", async () => {
    _resetRateLimitsForTests();
    await issueCode();
    const res = await authRoutes.request(
      "/auth/verify-otp",
      json({ email: EMAIL, code: "000000" }),
    );
    expect(res.status).toBe(401);
  });

  it("rejects reuse of a consumed code", async () => {
    _resetRateLimitsForTests();
    const code = await issueCode();
    await authRoutes.request("/auth/verify-otp", json({ email: EMAIL, code }));
    const again = await authRoutes.request("/auth/verify-otp", json({ email: EMAIL, code }));
    expect(again.status).toBe(401);
  });

  it("burns the previous code when a new one is issued", async () => {
    _resetRateLimitsForTests();
    // A fresh address each time so the burn-on-reissue assertion does not
    // race the per-address request rate limiter.
    const email = "burn@tarima.test";
    const first = await issueCode(email);
    // Reset so the second issue is not rejected by the request rate limiter;
    // the burn-on-reissue behaviour under test is independent of it.
    _resetRateLimitsForTests();
    const second = await issueCode(email);

    const stale = await authRoutes.request("/auth/verify-otp", json({ email, code: first }));
    expect(stale.status).toBe(401);

    const fresh = await authRoutes.request("/auth/verify-otp", json({ email, code: second }));
    expect(fresh.status).toBe(200);
  });

  it("rejects a malformed request body", async () => {
    const res = await authRoutes.request("/auth/request-otp", json({ email: "nope" }));
    expect(res.status).toBe(400);
  });

  it("returns the same response shape regardless of address validity", async () => {
    const res = await authRoutes.request(
      "/auth/request-otp",
      json({ email: "someone-else@example.com" }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("rate limits repeated requests", async () => {
    _resetRateLimitsForTests();
    const codes = await Promise.all(
      Array.from({ length: 12 }, () =>
        authRoutes.request("/auth/request-otp", json({ email: "burst@tarima.test" })),
      ),
    );
    expect(codes.some((r) => r.status === 429)).toBe(true);
  });
});
