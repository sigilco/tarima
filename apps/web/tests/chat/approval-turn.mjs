// SP8 gated-tool turn proof driver. Drives the exact wire path the
// browser panel uses (POST /api/eve/v1/session + the ndjson stream),
// but for a turn whose tool call requires human approval:
//
//   1. POST /api/eve/v1/session with a prompt that makes the agent call
//      send_email (the gated outbound tool).
//   2. Follow the stream until an `interaction.opened` fact with
//      request.kind === "approval" arrives -> the turn is PAUSED.
//   3. Assert the `approvals` mirror row is pending (done by run.sh).
//   4. POST /api/eve/v1/session/:id with
//      { answers: [{ interactionId, optionId: "approve" }] } — the same
//      body the panel's ChatApproval -> agent.respond() sends.
//   5. Follow the stream until the turn settles; assert send_email ran
//      (call.settled with capability.name === "send_email").
//
// The approvals/outbox assertions against sqlite live in run.sh; this
// script prints the interactionId and the sessionId for it.
const base = process.argv[2];
const cookieJar = process.argv[3];
const projectId = process.argv[4];
const sponsorEmail = process.argv[5] ?? "catering@farmhouse-kitchen.test";

const fs = await import("node:fs");
const cookie = fs
  .readFileSync(cookieJar, "utf8")
  .split("\n")
  .find((l) => l.includes("tarima_session"))
  ?.trim()
  .split("\t")
  .at(-1);
if (!cookie) throw new Error("no tarima_session cookie in jar");

const headers = {
  "content-type": "application/json",
  cookie: `tarima_session=${cookie}`,
};

const prompt = `Email the food sponsor at ${sponsorEmail} asking for a catering quote for 20 people for our Berkeley evening event. Use the send_email tool with projectId ${projectId}, subject "Catering quote for a Berkeley evening event", and a short polite body. Do not ask me for more details; call send_email now.`;

const body = {
  message: [{ type: "text", text: prompt }],
  clientContext: projectId
    ? { route: `/app/w/${projectId}`, projectId }
    : { route: "/app", note: "No project selected." },
};

// --- helpers ---------------------------------------------------------------

async function followStream(
  sessionId,
  { position, onFacts, onProgress, until, deadlineMs, label },
) {
  const started = Date.now();
  let settled = false;
  let outcome = null;
  for (let attempt = 0; attempt < 400 && !settled; attempt += 1) {
    if (Date.now() - started > deadlineMs) {
      console.error(`[approval] FAIL: ${label} deadline (${deadlineMs}ms) exceeded`);
      process.exit(1);
    }
    const qs = new URLSearchParams({
      follow: "false",
      startIndex: String(position),
      includeTailIndex: "1",
    });
    const stream = await fetch(`${base}/api/eve/v1/session/${sessionId}/stream?${qs}`, {
      headers: { cookie: `tarima_session=${cookie}`, accept: "application/x-ndjson" },
    });
    if (!stream.ok) {
      await new Promise((r) => setTimeout(r, 250));
      continue;
    }
    const reader = stream.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let done = false;
    while (!done && !settled) {
      const chunk = await reader.read();
      done = chunk.done;
      if (!chunk.value) continue;
      buf += decoder.decode(chunk.value, { stream: true });
      let nl;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        let rec;
        try {
          rec = JSON.parse(line);
        } catch {
          continue;
        }
        if (rec.$eve) {
          if (rec.$eve === "position") position = Math.max(position, rec.next ?? 0);
          continue;
        }
        if (typeof rec.at === "string" && Array.isArray(rec.facts)) {
          for (const fact of rec.facts) {
            if (fact.type === "turn.settled" || fact.type === "session.ended") {
              outcome = fact.data?.outcome ?? outcome;
              if (until(fact)) settled = true;
            }
            onFacts(fact);
            if (until(fact)) settled = true;
          }
        } else if (typeof rec.type === "string") {
          onProgress?.(rec);
        } else if (typeof rec.progress?.type === "string") {
          onProgress?.(rec.progress);
        }
      }
    }
    if (!settled) await new Promise((r) => setTimeout(r, 250));
  }
  return { position, outcome };
}

// --- 1. start the turn ------------------------------------------------------

const create = await fetch(`${base}/api/eve/v1/session`, {
  method: "POST",
  headers,
  body: JSON.stringify(body),
});
console.log(`[approval] POST /api/eve/v1/session -> ${create.status}`);
if (!create.ok) {
  console.error("[approval] FAIL:", await create.text());
  process.exit(1);
}
const accepted = await create.json();
const sessionId = accepted.sessionId ?? create.headers.get("x-eve-session-id");
console.log(`[approval] session: ${sessionId}`);
if (!sessionId) {
  console.error("[approval] FAIL: no sessionId in accept response");
  process.exit(1);
}

// --- 2. wait for the approval interaction to open ---------------------------

let approvalInteractionId = null;
let approvalRequest = null;
let position = 0;

const opened = await followStream(sessionId, {
  position,
  label: "approval-open",
  deadlineMs: 240_000,
  until: () => approvalInteractionId !== null,
  onFacts: (fact) => {
    if (fact.type === "interaction.opened" && fact.data?.request?.kind === "approval") {
      approvalInteractionId = fact.data.interactionId;
      approvalRequest = fact.data.request;
    }
  },
});
position = opened.position;

if (!approvalInteractionId) {
  console.error("[approval] FAIL: no approval interaction.opened observed on the stream");
  process.exit(1);
}
console.log(`[approval] interactionId: ${approvalInteractionId}`);
console.log(`[approval] prompt: ${JSON.stringify(approvalRequest?.prompt ?? "").slice(0, 200)}`);
console.log(
  `[approval] options: ${JSON.stringify((approvalRequest?.options ?? []).map((o) => o.id))}`,
);

// Marker for run.sh: the turn is paused at the gate; go assert the
// approvals mirror row is pending, then come back.
console.log("[approval] PAUSED_AT_GATE");

// --- 3. wait for run.sh to assert the pending row, then approve -------------

const goFile = process.argv[6];
if (goFile) {
  const deadline = Date.now() + 60_000;
  while (!fs.existsSync(goFile)) {
    if (Date.now() > deadline) {
      console.error("[approval] FAIL: go-file never appeared");
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, 250));
  }
}

// The exact body the panel sends from ChatApproval -> agent.respond().
const approve = await fetch(`${base}/api/eve/v1/session/${sessionId}`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    answers: [{ interactionId: approvalInteractionId, optionId: "approve" }],
  }),
});
console.log(`[approval] POST respond(approve) -> ${approve.status}`);
if (!approve.ok) {
  console.error("[approval] FAIL:", await approve.text());
  process.exit(1);
}

// --- 4. follow until the turn settles ---------------------------------------

// call.settled carries only the callId (no capability); map callId ->
// tool name from the earlier call.requested facts.
const callNames = new Map();
const settledCalls = new Set();
const resumed = await followStream(sessionId, {
  position,
  label: "turn-settle",
  deadlineMs: 240_000,
  until: (fact) => fact.type === "turn.settled" || fact.type === "session.ended",
  onFacts: (fact) => {
    if (fact.type === "call.requested" && fact.data?.callId) {
      callNames.set(fact.data.callId, fact.data?.capability?.name ?? "unknown");
    }
    if (fact.type === "call.settled") {
      settledCalls.add(callNames.get(fact.data?.callId) ?? "unknown");
    }
  },
});

console.log(`[approval] turn outcome: ${resumed.outcome ?? "(none)"}`);
console.log(`[approval] settled calls: ${[...settledCalls].join(", ") || "(none)"}`);

const failures = [];
if (resumed.outcome && resumed.outcome !== "completed") {
  failures.push(`turn outcome ${resumed.outcome}`);
}
if (![...settledCalls].includes("send_email")) {
  failures.push("no call.settled for send_email after approval");
}
if (failures.length > 0) {
  console.error("[approval] FAIL:", failures.join("; "));
  process.exit(1);
}
console.log(
  "[approval] PASS: approval paused the turn, respond(approve) resumed it, send_email ran",
);
