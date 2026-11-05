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
  const raw = JSON.stringify(payload);
  const hex = createHmac("sha256", secret).update(raw, "utf8").digest("hex");
  return fetch(`http://127.0.0.1:${evePort}/eve/v1/whatsapp`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-hub-signature-256": `sha256=${hex}` },
    body: raw,
  });
}

const appDb = new Database(dbPath);
const code = appDb
  .prepare("SELECT code FROM __w3_codes WHERE id = (SELECT MAX(id) FROM __w3_codes)")
  .get()?.code;
if (!code) fail("no connect code staged by whatsapp-run.sh");

// 0. The eve route must exist.
let res = await inbound({ text: "hello bot" });
if (res.status !== 200) fail(`webhook status ${res.status}: ${await res.text()}`);

// 1. Stranger: connect notice delivered through the mock Graph API, no turn.
let sends = await waitFor(
  async () => {
    const all = await mockSends();
    return all.length > 0 ? all : undefined;
  },
  40,
  250,
);
if (!sends) fail("stranger notice never reached the mock Graph API");
const notice = sends[0];
if (!/isn't connected/i.test(notice.text ?? ""))
  fail(`stranger reply wrong: ${JSON.stringify(notice)}`);
console.log(`[wa-e2e] stranger answered: "${notice.text}"`);

// 2. Bind via /start CODE; confirmation arrives through the mock.
const before = (await mockSends()).length;
res = await inbound({ text: `/start ${code}` });
if (res.status !== 200) fail(`bind webhook status ${res.status}`);
sends = await waitFor(
  async () => {
    const all = await mockSends();
    return all.length > before ? all.slice(before) : undefined;
  },
  40,
  250,
);
if (!sends || !/Connected/i.test(sends[0]?.text ?? "")) {
  fail(`binding confirmation missing: ${JSON.stringify(sends)}`);
}
console.log(`[wa-e2e] binding confirmed for ${SENDER} via code ${code}`);

// 3. Bound message: stub agent turn, reply lands at the mock.
const boundBefore = (await mockSends()).length;
res = await inbound({ text: "Say hi in one short sentence." });
if (res.status !== 200) fail(`bound webhook status ${res.status}`);
console.log("[wa-e2e] waiting for the agent reply...");
const bound = await waitFor(
  async () => {
    const all = await mockSends();
    return all.length > boundBefore ? all.slice(boundBefore) : undefined;
  },
  240,
  500,
);
if (!bound) fail("no agent reply reached the mock for the bound number");
const replyText = bound.map((s) => s.text ?? "").join(" ");
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
const dupId = `wamid.dup-${Math.random().toString(36).slice(2)}`;
const dupBefore = (await mockSends()).length;
res = await inbound({ text: "Exactly-once check", id: dupId });
if (res.status !== 200) fail(`dup webhook status ${res.status}`);
await waitFor(
  async () => {
    const all = await mockSends();
    return all.length > dupBefore ? all : undefined;
  },
  240,
  500,
);
const afterFirst = (await mockSends()).length;
res = await inbound({ text: "Exactly-once check", id: dupId });
if (res.status !== 200) fail(`dup replay status ${res.status}`);
await wait(4000);
const afterReplay = (await mockSends()).length;
if (afterReplay !== afterFirst) {
  fail(`duplicate wamid produced another reply (${afterFirst} -> ${afterReplay})`);
}
console.log(`[wa-e2e] duplicate wamid ${dupId} processed once (${afterReplay} sends, unchanged)`);

console.log(
  `[wa-e2e] PASS — principal=${principal}, turn.settled=${turnRows}, replies via mock Graph API, duplicate id deduped`,
);
