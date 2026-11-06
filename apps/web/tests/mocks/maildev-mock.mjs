/**
 * Mock Brevo transactional mail API on top of MailDev 3 (T1): the
 * `POST /v3/smtp/email` endpoint apps/api/src/mail.ts and the email
 * adapter in @tarima/channels call, recording every send and exposing
 * the captured messages at `GET /inbox` so existing assertions survive.
 *
 * Unlike the old hand-rolled mock, accepted mail is also injected into an
 * embedded MailDev instance over real SMTP, so a human gets the MailDev
 * web UI (and its MCP server) to inspect renders: the shim proxies every
 * non-API request to the MailDev web server, so the mock's own port
 * serves the UI too.
 *
 * Start on an ephemeral port with `startMailDev()`. The handle keeps the
 * mail-mock.mjs contract: `{ sent, server, start(), stop() }`.
 */
import { createServer, request as httpRequest } from "node:http";
import { connect } from "node:net";
import MailDev from "maildev";

/** Read one SMTP reply (handles multi-line "250-..." continuations). */
function readSmtpReply(socket, buffer) {
  return new Promise((resolve, reject) => {
    const onData = (chunk) => {
      buffer.data += chunk.toString("utf8");
      const lines = buffer.data.split("\r\n").filter(Boolean);
      const last = lines[lines.length - 1];
      // A reply is complete when its last line is "NNN " (space, not dash).
      if (last && /^\d{3} /.test(last)) {
        socket.off("data", onData);
        resolve({ code: Number(last.slice(0, 3)), text: last });
      }
    };
    socket.on("data", onData);
    socket.once("error", reject);
  });
}

function smtpSend(socket, line) {
  socket.write(`${line}\r\n`);
}

/** Escape header values and dot-stuff the body per RFC 5321. */
function buildMime({ from, to, subject, text, html, replyTo }) {
  const headers = [
    `From: ${from}`,
    `To: ${to.join(", ")}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
    html ? 'Content-Type: text/html; charset="utf-8"' : 'Content-Type: text/plain; charset="utf-8"',
    "Content-Transfer-Encoding: 8bit",
  ];
  const body = (html ?? text ?? "")
    .split("\n")
    .map((line) => (line.replace(/\r$/, "").startsWith(".") ? `.${line}` : line))
    .join("\r\n");
  return `${headers.join("\r\n")}\r\n\r\n${body}\r\n`;
}

/** Deliver a Brevo-shaped record into MailDev over real SMTP. */
async function smtpInject(smtpPort, { from, to, mime }) {
  const socket = connect({ host: "127.0.0.1", port: smtpPort });
  const buffer = { data: "" };
  try {
    await new Promise((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("error", reject);
    });
    const expect = async (line, ok) => {
      if (line !== null) smtpSend(socket, line);
      const reply = await readSmtpReply(socket, buffer);
      if (!ok.includes(reply.code)) throw new Error(`smtp reply ${reply.code}: ${reply.text}`);
    };
    await expect(null, [220]);
    await expect("EHLO mock.local", [250]);
    await expect(`MAIL FROM:<${from}>`, [250]);
    for (const rcpt of to) await expect(`RCPT TO:<${rcpt}>`, [250, 251]);
    await expect("DATA", [354]);
    smtpSend(socket, `${mime}\r\n.`);
    const done = await readSmtpReply(socket, buffer);
    if (done.code !== 250) throw new Error(`smtp data rejected: ${done.text}`);
    smtpSend(socket, "QUIT");
  } finally {
    socket.destroy();
  }
}

/**
 * The Brevo API shim plus a transparent proxy to the embedded MailDev web
 * server for every other path, so the UI is reachable on the mock port.
 */
export function startMailDev({ port = 0 } = {}) {
  /** Every accepted send: { sender, to, subject, text, html, at }. */
  const sent = [];

  const maildev = new MailDev({
    smtp: 0,
    web: 0,
    ip: "127.0.0.1",
    webIp: "127.0.0.1",
    silent: true,
  });
  let smtpPort = 0;
  let webPort = 0;

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
    if (req.method === "POST" && req.url === "/v3/smtp/email") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        void (async () => {
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
            replyTo: parsed.replyTo?.email ?? null,
            at: Date.now(),
          };
          const from = record.sender?.email ?? "notifications@tarima.illo.fyi";
          try {
            await smtpInject(smtpPort, {
              from,
              to: record.to,
              mime: buildMime({
                from: record.sender?.name ? `"${record.sender.name}" <${from}>` : from,
                to: record.to,
                subject: record.subject,
                text: record.text,
                html: record.html,
                replyTo: record.replyTo,
              }),
            });
          } catch (error) {
            reply(502, { message: `maildev inject failed: ${error}`, code: "smtp_error" });
            return;
          }
          sent.push(record);
          // Brevo-shaped success response.
          reply(201, { messageId: `<mock-${sent.length}@tarima.test>` });
        })();
      });
      return;
    }
    // Everything else proxies to the MailDev web UI/API on its own port.
    const upstream = httpRequest(
      {
        host: "127.0.0.1",
        port: webPort,
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: `127.0.0.1:${webPort}` },
      },
      (up) => {
        res.statusCode = up.statusCode ?? 502;
        for (const [name, value] of Object.entries(up.headers)) {
          if (value !== undefined) res.setHeader(name, value);
        }
        up.pipe(res);
      },
    );
    upstream.on("error", () => {
      res.statusCode = 502;
      res.end("maildev web unavailable");
    });
    req.pipe(upstream);
  });

  return {
    sent,
    server,
    async start() {
      const servers = await maildev.start();
      smtpPort = servers.smtp.getAddress().port;
      webPort = servers.api?.getAddress()?.port ?? 0;
      await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
      const address = server.address();
      const actual = typeof address === "object" && address ? address.port : port;
      return { port: actual, baseUrl: `http://127.0.0.1:${actual}` };
    },
    async stop() {
      await new Promise((resolve) => server.close(resolve));
      await maildev.stop();
    },
  };
}
