/**
 * Auth api handlers (OTP request/verify + loopback admin inbox).
 *
 * Ported from apps/api/src/routes/auth.ts: the same valibot schemas,
 * rate limits, beta allowlist and session minting, as plain
 * (Request => Response) functions instead of Hono routes.
 */
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import * as v from "valibot";
import {
  MAX_VERIFY_ATTEMPTS,
  generateOtpCode,
  hashOtp,
  isOtpExpired,
  otpExpiresAt,
} from "@tarima/auth-core/otp";
import {
  checkFailedVerify,
  checkRequestOtp,
  recordFailedVerify,
  recordRequestOtp,
} from "@tarima/auth-core/rate-limit";
import {
  SESSION_TTL_SECONDS,
  createSessionToken,
  sessionCookieHeader,
} from "@tarima/auth-core/session";
import { NOT_ALLOWLISTED_ERROR, isAllowlisted } from "@tarima/contract";
import { audit } from "@tarima/obs";
import { db } from "@tarima/api/db";
import { loopbackInbox, otpCodes, sessions, users } from "@tarima/api/db/schema";
import { extractOtp } from "@tarima/api/lib/extract-otp";
import { sendMail } from "@tarima/api/mail";
import { sessionSecret } from "@tarima/api/services/session";
import { readJson } from "./helpers";

const requestSchema = v.object({
  email: v.pipe(v.string(), v.trim(), v.email()),
});

const verifySchema = v.object({
  email: v.pipe(v.string(), v.trim(), v.email()),
  code: v.pipe(v.string(), v.regex(/^\d{6}$/)),
});

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

// The bundler statically replaces `process.env.NODE_ENV` with the
// build-time value ("production" for the nitro build), which would fold
// the admin-inbox guard away. Read it through a computed key so the
// check stays a runtime decision, like the standalone api's tsx run.
const NODE_ENV_KEY = "NODE_ENV";
function isProduction(): boolean {
  return process.env[NODE_ENV_KEY] === "production";
}

function otpEmailHtml(code: string): string {
  return `<p>Your Tarima sign in code is <strong>${code}</strong>.</p><p>It expires in 5 minutes.</p>`;
}

/** POST /auth/request-otp — body { email }. */
export async function handleRequestOtp(request: Request): Promise<Response> {
  const parsed = v.safeParse(requestSchema, await readJson(request));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const email = normalize(parsed.output.email);
  const ip = request.headers.get("x-forwarded-for") ?? undefined;
  const limit = checkRequestOtp(email, ip);
  if (!limit.ok) return Response.json({ error: "too_many_requests" }, { status: 429 });
  recordRequestOtp(email, ip);

  const code = generateOtpCode();

  // Burn any previously issued, still unconsumed code so only the newest
  // one can ever verify.
  db.update(otpCodes)
    .set({ consumedAt: Date.now() })
    .where(and(eq(otpCodes.email, email), isNull(otpCodes.consumedAt)))
    .run();

  db.insert(otpCodes)
    .values({
      id: randomUUID(),
      email,
      codeHash: hashOtp(code),
      expiresAt: otpExpiresAt().getTime(),
      createdAt: Date.now(),
    })
    .run();

  await sendMail({
    to: email,
    subject: "Your Tarima sign in code",
    text: `Your Tarima sign in code is ${code}. It expires in 5 minutes.`,
    html: otpEmailHtml(code),
  }).catch((err) => console.error("[mail] otp send failed", err));

  audit("auth.otp_requested", { userId: email, target: "auth", extra: { email } });

  // Always the same response: never reveal whether the address exists.
  return Response.json({ ok: true });
}

/** POST /auth/verify-otp — body { email, code }; sets the session cookie. */
export async function handleVerifyOtp(request: Request): Promise<Response> {
  const parsed = v.safeParse(verifySchema, await readJson(request));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400 });

  const email = normalize(parsed.output.email);
  const code = parsed.output.code;

  const limit = checkFailedVerify(email, Date.now());
  if (!limit.ok) return Response.json({ error: "too_many_requests" }, { status: 429 });

  const row = db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.email, email), isNull(otpCodes.consumedAt)))
    // Two codes issued in the same millisecond tie on createdAt, so break
    // the tie on the rowid-backed primary key to guarantee "newest wins".
    .orderBy(desc(otpCodes.createdAt), desc(sql`rowid`))
    .get();

  const codeMatches =
    row !== undefined &&
    !isOtpExpired({ expiresAt: new Date(row.expiresAt) }) &&
    bcrypt.compareSync(code, row.codeHash);

  const invalid = () => {
    recordFailedVerify(email);
    return Response.json({ error: "invalid_code" }, { status: 401 });
  };

  if (!codeMatches || row === undefined) {
    if (row) {
      const attempts = row.attempts + 1;
      db.update(otpCodes)
        .set({
          attempts,
          consumedAt: attempts > MAX_VERIFY_ATTEMPTS ? Date.now() : null,
        })
        .where(eq(otpCodes.id, row.id))
        .run();
    }
    return invalid();
  }

  // Beta gate: when BETA_ALLOWLIST is set, only listed emails verify.
  // The check runs after the code check, so a wrong code still reads as
  // a wrong code and only a correct code for an unlisted address
  // answers 403.
  if (!isAllowlisted(process.env.BETA_ALLOWLIST, email)) {
    recordFailedVerify(email);
    return Response.json({ error: NOT_ALLOWLISTED_ERROR }, { status: 403 });
  }

  db.update(otpCodes).set({ consumedAt: Date.now() }).where(eq(otpCodes.id, row.id)).run();

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

  audit("auth.otp_verified", { userId: user.id, target: "auth", extra: { email } });

  return Response.json(
    { ok: true, userId: user.id },
    {
      headers: {
        "Set-Cookie": sessionCookieHeader(token, isProduction()),
      },
    },
  );
}

/** GET /internal/admin/inbox?to=<email> — 404 in production. */
export function handleAdminInbox(request: Request): Response {
  if (isProduction()) {
    return new Response("not found", { status: 404 });
  }

  const to = new URL(request.url).searchParams.get("to");
  if (!to) return Response.json({ error: "missing_to" }, { status: 400 });

  const rows = db
    .select()
    .from(loopbackInbox)
    .where(eq(loopbackInbox.toAddr, normalize(to)))
    .orderBy(desc(loopbackInbox.createdAt))
    .all();

  return Response.json({
    messages: rows.map((row) => ({
      id: row.id,
      to: row.toAddr,
      from: row.fromAddr,
      subject: row.subject,
      body: row.body,
      createdAt: row.createdAt,
      otp: extractOtp(row.html ?? row.body),
    })),
  });
}
