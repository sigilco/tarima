/**
 * Boot the three shared mock services as long-lived processes for the
 * channels e2e harness (run.sh): keeps the parent alive until every
 * mock's port answers, then waits on the mocks. Exits non-zero if any
 * mock dies, so the bash harness fails fast.
 */
import { startMockMail } from "../mocks/mail-mock.mjs";
import { startMockTelegram } from "../mocks/telegram-mock.mjs";
import { startMockWhatsapp } from "../mocks/whatsapp-mock.mjs";

const [tgPort, waPort, mailPort] = process.argv.slice(2).map(Number);
if (!tgPort || !waPort || !mailPort) {
  console.error("usage: mock-boot.mjs <tg-port> <wa-port> <mail-port>");
  process.exit(2);
}

const tg = startMockTelegram({ port: tgPort });
const wa = startMockWhatsapp({ port: waPort });
const mail = startMockMail({ port: mailPort });
await Promise.all([tg.start(), wa.start(), mail.start()]);
console.log(`[mock-boot] telegram :${tgPort}  whatsapp :${waPort}  mail :${mailPort}`);

// Mirror every recorded send into per-channel logs the harness dumps on
// failure (the handles keep them in memory; this also makes stdout the
// assertion surface without new HTTP endpoints on the mocks).
const seen = new Map();
setInterval(() => {
  for (const [name, handle] of [
    ["tg", tg],
    ["wa", wa],
    ["mail", mail],
  ]) {
    const n = handle.sent.length;
    if (n > (seen.get(name) ?? 0)) {
      for (const record of handle.sent.slice(seen.get(name) ?? 0)) {
        console.log(`[mock:${name}]`, JSON.stringify(record).slice(0, 400));
      }
      seen.set(name, n);
    }
  }
}, 250).unref();

// Fail fast if any mock exits unexpectedly.
for (const [name, handle] of [
  ["tg", tg],
  ["wa", wa],
  ["mail", mail],
]) {
  handle.server.on("close", () => {
    console.error(`[mock-boot] ${name} mock closed`);
    process.exit(1);
  });
}

// Stay alive until the parent kills us.
setInterval(() => {}, 10_000);
