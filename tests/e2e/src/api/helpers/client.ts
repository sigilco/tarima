/**
 * Thin HTTP client for the e2e suites.
 *
 * It speaks the api the way the browser does: same-origin endpoints, a
 * session cookie carried across calls, no api keys. The session cookie is
 * captured from the `Set-Cookie` header of the login answer and replayed
 * on every later call.
 */
import { LOOPBACK_DOMAIN } from "./server";

/** One HTTP answer: the status and the parsed json body. */
export interface Answer<T = unknown> {
  status: number;
  body: T;
}

/** A client bound to one base url and one session cookie. */
export class ApiClient {
  /** The session cookie, ready for a `Cookie` header. */
  cookie: string | undefined;

  constructor(private readonly baseUrl: string) {}

  /** Perform a request against the api and parse the answer. */
  async request<T = unknown>(
    path: string,
    init: RequestInit & { cookie?: string } = {},
  ): Promise<Answer<T>> {
    const headers = new Headers(init.headers);
    if (init.body && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
    const cookie = init.cookie ?? this.cookie;
    if (cookie) headers.set("cookie", cookie);

    const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers });
    const text = await res.text();
    let body: unknown = null;
    if (text.length > 0) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }
    return { status: res.status, body: body as T };
  }

  /** GET a path. */
  get<T = unknown>(path: string, init: RequestInit = {}): Promise<Answer<T>> {
    return this.request<T>(path, { ...init, method: "GET" });
  }

  /** POST a json body. */
  post<T = unknown>(path: string, body?: unknown, init: RequestInit = {}): Promise<Answer<T>> {
    return this.request<T>(path, {
      ...init,
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }
}

/** The one-time code the loopback inbox captured for `email`. */
export interface InboxMessage {
  id: string;
  to: string;
  from: string | null;
  subject: string;
  body: string;
  createdAt: number;
  otp: string | null;
}

/** Read the loopback inbox of the api for one recipient. */
export async function readInbox(baseUrl: string, email: string): Promise<InboxMessage[]> {
  const res = await fetch(`${baseUrl}/internal/admin/inbox?to=${encodeURIComponent(email)}`);
  if (!res.ok) throw new Error(`inbox read failed: ${res.status}`);
  const payload = (await res.json()) as { messages: InboxMessage[] };
  return payload.messages;
}

/**
 * Ask for an OTP code and read it back from the loopback inbox.
 *
 * The loopback inbox is the same seam the dev loop uses, so the suite
 * never needs a real mail provider.
 */
export async function requestOtpCode(baseUrl: string, email: string): Promise<string> {
  const res = await fetch(`${baseUrl}/auth/request-otp`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(`request-otp failed: ${res.status}`);

  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const messages = await readInbox(baseUrl, email);
    const otp = messages.find((message) => message.otp)?.otp;
    if (otp) return otp;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`no otp captured for ${email} within 10s`);
}

/**
 * Log in with an email and a one-time code, and keep the session cookie.
 *
 * Returns the client so a test can chain the calls.
 */
export async function login(baseUrl: string, email: string): Promise<ApiClient> {
  const client = new ApiClient(baseUrl);
  const code = await requestOtpCode(baseUrl, email);

  const res = await fetch(`${baseUrl}/auth/verify-otp`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  if (!res.ok) throw new Error(`verify-otp failed: ${res.status}`);

  const setCookie = res.headers.get("set-cookie");
  const cookie = setCookie?.split(";")[0];
  if (!cookie) throw new Error("verify-otp did not set a session cookie");
  client.cookie = cookie;
  return client;
}

/** A fresh loopback email address for one test. */
export function testEmail(prefix = "e2e"): string {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return `${prefix}-${stamp}@${LOOPBACK_DOMAIN}`;
}

/**
 * Mint an api key for the logged-in user.
 *
 * The machine surface (the Bearer routes) needs a key; the session
 * cookie only opens the browser surface. The key is minted through the
 * session-authenticated `/api/api-keys` route, so the suite never writes
 * to the database directly.
 */
export async function mintApiKey(client: ApiClient, scopes: string[]): Promise<string> {
  const answer = await client.post<{ key: string }>("/api/api-keys", {
    name: "e2e",
    scopes,
  });
  if (answer.status !== 201) {
    throw new Error(`could not mint an api key: ${answer.status}`);
  }
  return answer.body.key;
}
