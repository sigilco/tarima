/**
 * Mock Telegram Bot API (SP6-B): just enough of api.telegram.org for
 * eve's telegram channel (packages/eve/dist/src/public/channels/
 * telegram/api.js) — sendMessage, sendChatAction,
 * answerCallbackQuery, editMessageText, editMessageReplyMarkup, getFile,
 * plus the /file/bot<token>/<path> download endpoint — recording every
 * outbound call and letting a test queue an inbound update that the test
 * itself delivers to the webhook path.
 *
 * Dependency-free (node:http). Start on an ephemeral port with
 * `startMockTelegram()`; the returned handle exposes `calls` (recorded
 * method + body), `stop()`, and the `port`/`baseUrl`.
 */
import { createServer } from "node:http";

/** Methods eve's channel actually calls; unknown ones are acknowledged. */
const KNOWN_METHODS = new Set([
  "sendMessage",
  "sendChatAction",
  "answerCallbackQuery",
  "editMessageText",
  "editMessageReplyMarkup",
  "getFile",
]);

export function startMockTelegram({ port = 0 } = {}) {
  /** Every Bot API call: { method, body, at }. `sent` keeps sendMessage only. */
  const calls = [];
  const sent = [];

  const server = createServer((req, res) => {
    const reply = (status, payload) => {
      res.statusCode = status;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(payload));
    };
    // GET /file/bot<token>/<file_path>: serve a tiny placeholder.
    const fileMatch = /^\/file\/bot[^/]+\/(.+)$/.exec(req.url ?? "");
    if (req.method === "GET" && fileMatch) {
      reply(200, { ok: true, placeholder: true, path: fileMatch[1] });
      return;
    }
    // POST /bot<token>/<method>: record and answer.
    const method = /^\/bot[^/]+\/(\w+)$/.exec(req.url ?? "")?.[1];
    if (req.method !== "POST" || !method) {
      reply(404, { ok: false, description: `unknown route ${req.url}` });
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
      const record = { method, body: parsed, at: Date.now() };
      calls.push(record);
      if (method === "sendMessage") sent.push(parsed);
      if (!KNOWN_METHODS.has(method)) {
        reply(404, { ok: false, description: `not implemented: ${method}` });
        return;
      }
      if (method === "getFile") {
        reply(200, {
          ok: true,
          result: { file_id: parsed.file_id ?? "", file_path: "mock/file.txt" },
        });
        return;
      }
      reply(200, {
        ok: true,
        result:
          method === "sendMessage"
            ? {
                message_id: sent.length,
                chat: { id: Number(parsed.chat_id ?? 0), type: "private" },
              }
            : {},
      });
    });
  });

  return {
    calls,
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
