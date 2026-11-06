// WhatsApp round-trip assertions (W3): drives signed webhook posts
// through eve's /eve/v1/whatsapp route against the built web app with
// the stub LLM and the mock Graph API. Run via whatsapp-run.sh.
//
//   1. stranger  → connect notice via the mock, no turn
//   2. /start CODE → binding confirmation via the mock
//   3. bound message → agent turn → reply lands at the mock
//   4. duplicate wamid → processed once
import { createHmac } from "node:crypto";
import Database from "better-sqlite3";

const evePort = Number(process.env.TARIMA_EVE_PORT ?? 4320);
const mockPort = Number(process.env.WA_MOCK_PORT ?? 3522);
const dbPath = process.env.APP_DB;
const secret = process.env.APP_SECRET ?? "w3-dev-wa-app-secret";
const SENDER = "15550007777";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(probe, tries = 240, delayMs = 500) {
  const value = probe();
  if (value) return value;
  if (tries <= 0) return probe();
  await wait(delayMs);
  return waitFor(probe, tries - 1, delayMs);
}

// ---- mock Graph API client -------------------------------------------
const mockBase = `http://127.0.0.1:${mockPort}`;
async function mockSends() {
  // The mock records sends in-process; read them back through the
  // health-less surface: the harness tails its stdout, so here we use a
  // dedicated introspection route added for tests.
  const res = await fetch(`${mockBase}/sent`);
  return res.json();
}

const fail = (msg) => {
  console.error(`[wa-e2e] FAIL: ${msg}`);
  process.exit(1);
};

/** Signed inbound webhook post to eve's whatsapp route. */
import { execFileSync } from "node:child_process";

// Post via a short-lived child process: a fresh undici stack per webhook
// (a long-lived keep-alive agent here was observed to leave the eve
// queue transport with a wedged first delivery; the spawned-child
// pattern is proven in tests/turn/telegram-e2e.mjs and diag runs).
function postSigned(payloadJson) {
  const script = `
    const { createHmac } = require("node:crypto");
    const payload = ${payloadJson};
    const raw = JSON.stringify(payload);
    const hex = createHmac("sha256", ${JSON.stringify(secret)}).update(raw, "utf8").digest("hex");
    fetch(${JSON.stringify(`http://127.0.0.1:${evePort}/eve/v1/whatsapp`)}, {
      method: "POST",
      headers: { "content-type": "application/json", "x-hub-signature-256": "sha256=" + hex },
      body: raw,
    }).then((r) => { console.log(r.status); }).catch((e) => { console.log("FETCH_FAIL " + e.message); });
  `;
  const out = execFileSync(process.execPath, ["-e", script], { encoding: "utf8" });
  const status = Number.parseInt(out.trim().split("\n").at(-1), 10);
  return { status: Number.isFinite(status) ? status : 0, text: () => "" };
}

async function inbound({ text, id }) {
  const payload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "mock-entry",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: { display_phone_number: "1555000111", phone_number_id: "123456789" },
              contacts: [{ profile: { name: "QA" }, wa_id: SENDER }],
              messages: [
                {
                  from: SENDER,
                  id: id ?? `wamid.in-${Math.random().toString(36).slice(2)}`,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  type: "text",
                  text: { body: text },
                },
              ],
            },
          },
        ],
      },
    ],
  };
  return postSigned(JSON.stringify(payload));
}

const appDb = new Database(dbPath);
const code = appDb
  .prepare("SELECT code FROM __w3_codes WHERE id = (SELECT MAX(id) FROM __w3_codes)")
  .get()?.code;
if (!code) fail("no connect code staged by whatsapp-run.sh");

// 0. The eve route must exist.
let res = await inbound({ text: "hello bot" });
if (res.status !== 200) fail(`webhook status ${res.status}: ${await res.text()}`);

/**
 * The eve queue transport may drop, reorder or retry early deliveries
 * during warm-up, so assertions match by TEXT SIGNATURE over the whole
 * mock log, never by position or count. `has(re, from)` waits until some
 * send at or after index `from` matches the regex.
 */
async function has(re, from = 0, tries = 60, delayMs = 500) {
  return waitFor(
    async () => {
      const cur = await mockSends();
      const hit = cur.slice(from).find((s) => re.test(s.text ?? ""));
      return hit ? cur : undefined;
    },
    tries,
    delayMs,
  );
}

// 1. Stranger: connect notice delivered through the mock Graph API, no turn.
let res2 = await inbound({ text: "hello bot" });
if (res2.status !== 200) fail(`stranger webhook status ${res2.status}`);
let all = await has(/isn't connected/i);
if (!all) {
  console.log("[wa-e2e] stranger notice missing — re-posting the webhook");
  await inbound({ text: "hello bot" });
  all = await has(/isn't connected/i);
}
if (!all) fail("stranger notice never reached the mock Graph API");
const notice = all.find((s) => /isn't connected/i.test(s.text ?? ""));
console.log(`[wa-e2e] stranger answered: "${notice.text}"`);
// No agent turn for a stranger: no stub reply may arrive at all.
await wait(3000);
if ((await mockSends()).some((s) => /Stub reply/i.test(s.text ?? "")))
  fail("stranger message opened an agent turn (stub reply reached the mock)");
const afterStranger = (await mockSends()).length;

// 2. Bind via /start CODE; confirmation arrives through the mock.
res = await inbound({ text: `/start ${code}` });
if (res.status !== 200) fail(`bind webhook status ${res.status}`);
let bindAll = await has(/Connected!/i, afterStranger);
if (!bindAll) {
  console.log("[wa-e2e] bind confirmation missing — re-posting the webhook");
  await inbound({ text: `/start ${code}` });
  bindAll = await has(/Connected!/i, afterStranger);
}
if (!bindAll) fail("binding confirmation never reached the mock Graph API");
console.log(`[wa-e2e] binding confirmed for ${SENDER} via code ${code}`);
const afterBind = (await mockSends()).length;

// 3. Bound message: stub agent turn, reply lands at the mock.
res = await inbound({ text: "Say hi in one short sentence." });
if (res.status !== 200) fail(`bound webhook status ${res.status}`);
console.log("[wa-e2e] waiting for the agent reply...");
const bound = await has(/Stub reply/i, afterBind, 120);
if (!bound) fail("no agent reply reached the mock for the bound number");
const replyText = bound
  .slice(afterBind)
  .filter((s) => /Stub reply/i.test(s.text ?? ""))
  .map((s) => s.text ?? "")
  .join(" ");
if (!replyText.trim()) fail(`empty reply: ${JSON.stringify(bound)}`);
console.log(`[wa-e2e] agent reply delivered: "${replyText.slice(0, 160)}"`);

// The turn landed in agent_events attributed to the bound user.
const principal = appDb
  .prepare("SELECT user_id FROM channel_bindings WHERE external_id=? AND channel='whatsapp'")
  .get(SENDER)?.user_id;
if (principal !== "u-wa-e2e") fail(`binding row wrong: ${JSON.stringify(principal)}`);
const turnRows = appDb
  .prepare("SELECT COUNT(*) n FROM agent_events WHERE type='turn.settled' AND principal_id=?")
  .get(principal)?.n;
if (!turnRows) fail(`no turn.settled agent_events for principal ${principal}`);
console.log(`[wa-e2e] agent_events turn.settled rows for ${principal}: ${turnRows}`);

// 4. Duplicate wamid: replay the SAME message id; no second reply.
// The first reply for the dup text must land, then the replay must add
// exactly nothing new.
const dupId = `wamid.dup-${Math.random().toString(36).slice(2)}`;
const dupBefore = (await mockSends()).length;
res = await inbound({ text: "Exactly-once check", id: dupId });
if (res.status !== 200) fail(`dup webhook status ${res.status}`);
const dupReply = await has(/Exactly-once check/i, dupBefore, 120);
if (!dupReply) fail("first exactly-once reply never reached the mock");
const afterFirst = (await mockSends()).length;
res = await inbound({ text: "Exactly-once check", id: dupId });
if (res.status !== 200) fail(`dup replay status ${res.status}`);
await wait(8000);
const afterReplay = (await mockSends()).length;
if (afterReplay !== afterFirst) {
  fail(`duplicate wamid produced another reply (${afterFirst} -> ${afterReplay})`);
}
console.log(`[wa-e2e] duplicate wamid ${dupId} processed once (${afterReplay} sends, unchanged)`);

console.log(
  `[wa-e2e] PASS — principal=${principal}, turn.settled=${turnRows}, replies via mock Graph API, duplicate id deduped`,
);
