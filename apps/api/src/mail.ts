import { randomUUID } from "node:crypto";
import { db } from "./db";
import { loopbackInbox } from "./db/schema";

interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
}

const DEFAULT_LOOPBACK_DOMAINS = "tarima.test";

/**
 * Brevo send endpoint; MAIL_API_BASE_URL overrides the origin (mocks/tests).
 * A base that already ends in /v3/smtp/email is used as-is.
 */
function mailEndpoint(): string {
  const base = (process.env.MAIL_API_BASE_URL ?? "https://api.brevo.com").replace(/\/+$/, "");
  return base.endsWith("/v3/smtp/email") ? base : `${base}/v3/smtp/email`;
}

/**
 * Domains whose mail never leaves the box. Anything addressed to one of
 * these is written to the `loopback_inbox` table so tests and agents can
 * read it back through the admin inbox endpoint instead of depending on a
 * real provider. Configured as a comma separated list in
 * EMAIL_LOOPBACK_DOMAINS.
 */
function loopbackDomains(): string[] {
  return (process.env.EMAIL_LOOPBACK_DOMAINS ?? DEFAULT_LOOPBACK_DOMAINS)
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
}

/** True when `to` belongs to a loopback domain. */
function isLoopbackRecipient(to: string): boolean {
  const domain = to.trim().toLowerCase().split("@")[1];
  if (!domain) return false;
  return loopbackDomains().includes(domain);
}

/**
 * Transactional mail seam. Loopback domains are captured in the database,
 * Brevo HTTP API is used when BREVO_API_KEY is set, and everything else
 * logs to stdout. Callers never see the provider.
 *
 * The provider host is overridable with MAIL_API_BASE_URL so dev and CI
 * can point the exact Brevo-shaped request at a local mock (the default
 * stays the real endpoint). MAIL_API_BASE_URL only replaces the origin;
 * the /v3/smtp/email path and request/response shape are identical.
 */
export async function sendMail(message: MailMessage): Promise<void> {
  if (isLoopbackRecipient(message.to)) {
    db.insert(loopbackInbox)
      .values({
        id: randomUUID(),
        toAddr: message.to.trim().toLowerCase(),
        fromAddr: message.from ?? process.env.MAIL_FROM ?? null,
        subject: message.subject,
        body: message.text,
        html: message.html ?? null,
      })
      .run();
    console.info("[mail:loopback]", message.subject, "->", message.to);
    return;
  }

  const apiKey = process.env.BREVO_API_KEY;
  // MAIL_API_BASE_URL overrides the Brevo endpoint (dev mock / tests);
  // when set it is used even without a key, since the mock needs none.
  const baseOverride = process.env.MAIL_API_BASE_URL?.replace(/\/+$/, "");
  if (!apiKey && !baseOverride) {
    console.info("[mail:noop]", message.subject, "->", message.to);
    return;
  }
  const res = await fetch(mailEndpoint(), {
    method: "POST",
    headers: {
      ...(apiKey ? { "api-key": apiKey } : {}),
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        email: process.env.MAIL_FROM ?? "notifications@tarima.illo.fyi",
        name: "Tarima",
      },
      to: [{ email: message.to }],
      subject: message.subject,
      textContent: message.text,
      ...(message.html ? { htmlContent: message.html } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`Brevo send failed: ${res.status} ${await res.text()}`);
  }
}
