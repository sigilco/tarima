/**
 * Mock Brevo transactional mail API (SP6-B): the
 * `POST /v3/smtp/email` endpoint apps/api/src/mail.ts calls (and the
 * same shape the email adapter in @tarima/channels uses), recording
 * every send and exposing the captured messages at `GET /inbox` so a
 * test can assert the exact email that went out.
 *
 * Dependency-free (node:http). Start on an ephemeral port with
 * `startMockMail()`.
 */
import { createServer } from "node:http";

export function startMockMail({ port = 0 } = {}) {
  /** Every accepted send: { sender, to, subject, text, html, at }. */
  const sent = [];

  const server = createServer((req, res) => {
    const reply = (status, payload) => {
      res.statusCode = status;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(payload));
    };
    if (req.method === "GET" && (req.url === "/inbox" || req.url?.startsWith("/inbox?"))) {
      reply(200, { count: sent.length, messages: sent });
      return;
    }
    if (req.method !== "POST" || req.url !== "/v3/smtp/email") {
      reply(404, { message: `unknown route ${req.url}`, code: "not_found" });
      return;
    }
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      let parsed = {};
      try {
        parsed = JSON.parse(body || "{}");
      } catch {
        parsed = {};
      }
      const record = {
        sender: parsed.sender ?? null,
        to: (parsed.to ?? []).map((t) => t?.email ?? String(t)),
        subject: parsed.subject ?? "",
        text: parsed.textContent ?? "",
        html: parsed.htmlContent ?? null,
        at: Date.now(),
      };
      sent.push(record);
      // Brevo-shaped success response.
      reply(201, { messageId: `<mock-${sent.length}@tarima.test>` });
    });
  });

  return {
    sent,
    server,
    async start() {
      await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
      const address = server.address();
      const actual = typeof address === "object" && address ? address.port : port;
      return { port: actual, baseUrl: `http://127.0.0.1:${actual}` };
    },
    stop() {
      return new Promise((resolve) => server.close(resolve));
    },
  };
}
