// SP6 proof without real Telegram credentials (plan D11).
//
// Boots the built web app (with the in-process eve runtime) on a
// throwaway SQLite DB, alongside a FAKE Telegram Bot API server. It
// then drives one full round trip:
//
//   fake Telegram update → POST /eve/v1/telegram (eve's channel route)
//     → tarima binding (/start CODE → channel_bindings)
//     → follow-up message → agent turn (real bifrost LLM)
//     → agent reply → fake Telegram server receives sendMessage
//     → assert reply text + agent_events row with the bound principal.
//
// Env: BIFROST_VK (real gateway key). Everything Telegram is fake.

import Database from "better-sqlite3";

const repoRoot = process.argv[2];
const port = Number(process.env.TURN_PORT ?? 3210);
const evePort = Number(process.env.TARIMA_EVE_PORT ?? 4310);
const tgPort = Number(process.env.TG_FAKE_PORT ?? 3410);
const tmp = process.env.TG_E2E_TMP;
const dbPath = `${tmp}/tg.db`;
const secret = "sp6-dev-webhook-secret";

// ---- fake Telegram Bot API -------------------------------------------
// Only the methods eve's channel actually calls
// (packages/eve/dist/src/public/channels/telegram/api.js):
// sendMessage, sendChatAction, answerCallbackQuery, editMessageText.
const sent = [];
import { createServer } from "node:http";
const fake = createServer(async (req, res) => {
  let body = {};
  for await (const chunk of req) body = JSON.parse(chunk.toString() || "{}");
  const method = req.url?.split("/bot")[1]?.split("/")[1];
  if (method === "sendMessage") {
    sent.push(body);
    console.log(`[fake-tg] sendMessage chat=${body.chat_id}: ${JSON.stringify(body.text)}`);
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        ok: true,
        result: { message_id: sent.length, chat: { id: Number(body.chat_id), type: "private" } },
      }),
    );
    return;
  }
  console.log(`[fake-tg] ${method} (acknowledged)`);
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ ok: true, result: {} }));
});
await new Promise((r) => fake.listen(tgPort, "127.0.0.1", r));
const fakeStop = () => new Promise((r) => fake.close(r));

const update = (text, chatId = 777001) =>
  fetch(`http://127.0.0.1:${evePort}/eve/v1/telegram`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-telegram-bot-api-secret-token": secret },
    body: JSON.stringify({
      update_id: Date.now(),
      message: {
        message_id: Math.floor(Math.random() * 1e6),
        date: Math.floor(Date.now() / 1000),
        chat: { id: chatId, type: "private", first_name: "QA" },
        from: { id: 42, is_bot: false, first_name: "QA", username: "qa" },
        text,
      },
    }),
  });

// Poll `probe` until it is truthy (or `tries` elapses).
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(probe, tries = 240, delayMs = 500) {
  for (let i = 0; i < tries; i++) {
    const value = probe();
    if (value) return value;
    await wait(delayMs);
  }
  return probe();
}

const fail = (msg) => {
  console.error(`[tg-e2e] FAIL: ${msg}`);
  fakeStop();
  process.exit(1);
};

// 1. Bind: /start CODE through the webhook.
const appDb = new Database(dbPath);
const code = appDb
  .prepare("SELECT code FROM __sp6_codes WHERE id = (SELECT MAX(id) FROM __sp6_codes)")
  .get()?.code;
if (!code) fail("no connect code staged by run.sh");
let res = await update(`/start ${code}`);
if (res.status !== 200) fail(`webhook /start status ${res.status}`);
for (let i = 0; i < 40 && sent.length === 0; i++) await new Promise((r) => setTimeout(r, 250));
if (sent.length === 0 || !/Connected/i.test(sent[0]?.text ?? ""))
  fail(`binding confirmation not received: ${JSON.stringify(sent)}`);
console.log(`[tg-e2e] binding confirmed for chat 777001 via code ${code}`);

// 2. Unbound chat refused.
const before = sent.length;
await update("who am I?", 999002);
for (let i = 0; i < 40 && sent.length === before; i++) await new Promise((r) => setTimeout(r, 250));
const refusal = sent.at(-1)?.text ?? "";
if (!/isn't connected/i.test(refusal)) fail(`unbound chat not refused: ${refusal}`);
console.log(`[tg-e2e] unbound chat refused: "${refusal}"`);

// 3. Bound chat: real agent turn through bifrost.
sent.length = 0;
res = await update("What is my name according to tarima? Answer in one short sentence.");
if (res.status !== 200) fail(`webhook message status ${res.status}`);
console.log("[tg-e2e] waiting for the agent turn to deliver a reply...");
for (let i = 0; i < 240 && sent.length === 0; i++) await new Promise((r) => setTimeout(r, 500));
const reply = sent[0]?.text;
if (!reply) fail("no sendMessage received for the bound chat — turn never delivered");
console.log(`[tg-e2e] agent reply delivered: "${String(reply).slice(0, 200)}"`);

// 4. The turn landed in agent_events attributed to the bound user.
const events = appDb
  .prepare("SELECT type, principal_id, COUNT(*) n FROM agent_events GROUP BY type, principal_id")
  .all();
console.log("[tg-e2e] agent_events:", JSON.stringify(events));
const principal = appDb
  .prepare("SELECT user_id FROM channel_bindings WHERE external_id='777001' AND channel='telegram'")
  .get()?.user_id;
const turnRows = appDb
  .prepare("SELECT COUNT(*) n FROM agent_events WHERE type='turn.settled' AND principal_id=?")
  .get(principal)?.n;
if (!turnRows) fail(`no turn.settled agent_events for principal ${principal}`);

await fakeStop();
console.log(
  `[tg-e2e] PASS — principal=${principal}, turn.settled rows=${turnRows}, reply delivered via fake Telegram`,
);
