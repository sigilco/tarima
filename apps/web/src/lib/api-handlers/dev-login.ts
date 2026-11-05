/**
 * Dev-only instant login: GET /api/dev/login?email=<user>@tarima.test
 *
 * Mirrors the OTP-verify session-minting path but skips the OTP round
 * trip entirely: any `@tarima.test` address (the loopback-only mail
 * domain) gets a user row (created on first use, like first-login OTP
 * verify) and a real session cookie, then 302s to /app.
 *
 * Gated twice, both at runtime so a nitro production build cannot fold
 * them away: NODE_ENV !== "production" and DEV_LOGIN !== "0". Either
 * failing answers 404 so the route's existence is not revealed in prod.
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import {
  SESSION_TTL_SECONDS,
  createSessionToken,
  sessionCookieHeader,
} from "@tarima/auth-core/session";
import { hashOtp } from "@tarima/auth-core/otp";
import { audit } from "@tarima/obs";
import { db } from "@tarima/api/db";
import { sessions, users } from "@tarima/api/db/schema";
import { sessionSecret } from "@tarima/api/services/session";
import { isProduction } from "./helpers";

/** The loopback-only mail domain dev-login accepts. */
const DEV_DOMAIN = "@tarima.test";

// Same computed-key pattern as NODE_ENV: a literal `process.env.DEV_LOGIN`
// would be statically replaced at build time and could not be flipped at
// runtime.
const DEV_LOGIN_KEY = "DEV_LOGIN";

/** Dev-login is enabled: not production and not explicitly disabled. */
function devLoginEnabled(): boolean {
  return !isProduction() && process.env[DEV_LOGIN_KEY] !== "0";
}

/** GET /api/dev/login?email=... — 404 unless dev-gated, else 302 to /app. */
export async function handleDevLogin(request: Request): Promise<Response> {
  const notFound = () => new Response("not found", { status: 404 });
  if (!devLoginEnabled()) return notFound();

  const email = (new URL(request.url).searchParams.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email.endsWith(DEV_DOMAIN)) return notFound();

  const user =
    db.select().from(users).where(eq(users.email, email)).get() ??
    (() => {
      const created = { id: randomUUID(), email, createdAt: Date.now() };
      db.insert(users).values(created).run();
      return created;
    })();

  const token = createSessionToken(user.id, sessionSecret(), SESSION_TTL_SECONDS);

  db.insert(sessions)
    .values({
      id: randomUUID(),
      userId: user.id,
      tokenHash: hashOtp(token),
      expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
    })
    .run();

  audit("auth.dev_login", { userId: user.id, target: "auth", extra: { domain: DEV_DOMAIN } });

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/app",
      "Set-Cookie": sessionCookieHeader(token, isProduction()),
    },
  });
}
