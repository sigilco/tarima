// SP4-B chat-panel transport proof driver. Drives the exact wire path
// the browser panel uses: useEveAgent({ baseUrl: "/api/eve" }) ->
// same-origin nitro proxy -> loopback eve runtime.
//
//   POST /api/eve/v1/session            { message: [{type:"text",...}], clientContext }
//   GET  /api/eve/v1/session/:id/stream (ndjson line stream)
//
// Stream lines are eve protocol records: transport records {$eve:...},
// progress records {type:"content.delta"|"call.input"|...} and commit
// lines {at, facts:[{type,data,scope}]}. Assertions mirror the panel:
// a real model reply arrives (reply-phase parts), tool calls happen
// (call.requested facts), and the cookie gate holds.
const base = process.argv[2];
const cookieJar = process.argv[3];
const projectId = process.argv[4];

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

const prompt = `Organize an evening event in Berkeley, CA, next week or in two weeks, ~5:30-8:30 PM, topic: decision models (AI, e.g. Jev/Clef), 10-25 attendees. I have no sponsor or venue agreements yet. Help me find sponsors for (venue, food, AI credits for decision models); the venue+food sponsor may be the same (a restaurant/bar/cafe) but it must have wifi, allow seating by groups, and have a TV or projector to demo projects.`;

// Exactly what useChatAgent's prepareSend puts on the wire.
const body = {
  message: [{ type: "text", text: prompt }],
  clientContext: projectId
    ? { route: `/app/w/${projectId}`, projectId }
    : { route: "/app", note: "No project selected." },
};

// 1. Create the session with the first turn (what agent.send() does on
//    a fresh panel).
const create = await fetch(`${base}/api/eve/v1/session`, {
  method: "POST",
  headers,
  body: JSON.stringify(body),
});
console.log(`[chat] POST /api/eve/v1/session -> ${create.status}`);
if (!create.ok) {
  console.error("[chat] FAIL:", await create.text());
  process.exit(1);
}
const accepted = await create.json();
const sessionId = accepted.sessionId ?? create.headers.get("x-eve-session-id");
const deliveryId = accepted.deliveryId;
console.log(`[chat] session: ${sessionId} delivery: ${deliveryId}`);
if (!sessionId || !deliveryId) {
  console.error("[chat] FAIL: no sessionId/deliveryId in accept response");
  process.exit(1);
}

// 2. Follow the session stream until the turn settles (this is what the
//    panel renders from). Eve's raw stream lease ends when it reaches the
//    tail — the client SDK reconnects (see open-stream.js
//    followStreamLines) — so mirror that: re-open from the last seen
//    position until the turn settles.
const replyTexts = new Map(); // partId -> text
const completedParts = new Set(); // partIds whose full text has landed
const toolNames = new Set();
let position = 0;
let settled = false;
let outcome = null;

const deadline = setTimeout(() => {
  console.error("[chat] FAIL: turn deadline (240s) exceeded");
  console.error(
    `[chat] partial: tools=${[...toolNames]} reply=${[...replyTexts.values()].join("").slice(0, 200)}`,
  );
  process.exit(1);
}, 240_000);

const handleFacts = (facts) => {
  for (const fact of facts) {
    if (fact.type === "call.requested") toolNames.add(fact.data?.capability?.name ?? "unknown");
    if (fact.type === "content.completed" && fact.data?.phase === "reply") {
      completedParts.add(fact.data.partId);
    }
    if (fact.type === "turn.settled") {
      settled = true;
      outcome = fact.data?.outcome ?? outcome;
    }
    if (fact.type === "session.ended") {
      settled = true;
      outcome = fact.data?.outcome ?? outcome;
    }
  }
};
const handleProgress = (rec) => {
  if (rec?.type === "content.delta" && typeof rec.data?.delta === "string") {
    // Deltas stream the part; once the part completes, a re-follow from 0
    // would replay them — keep only the first pass per part to avoid
    // doubling the text.
    const id = rec.data.partId;
    if (completedParts.has(id)) return;
    replyTexts.set(id, (replyTexts.get(id) ?? "") + rec.data.delta);
  }
};

const firstOpen = Date.now();
let firstByteMs = null;

for (let attempt = 0; attempt < 200 && !settled; attempt += 1) {
  const qs = new URLSearchParams({
    follow: "false",
    startIndex: String(position),
    includeTailIndex: "1",
  });
  const stream = await fetch(`${base}/api/eve/v1/session/${sessionId}/stream?${qs}`, {
    headers: { cookie: `tarima_session=${cookie}`, accept: "application/x-ndjson" },
  });
  if (attempt === 0) {
    console.log(`[chat] GET stream -> ${stream.status} ${stream.headers.get("content-type")}`);
  }
  if (!stream.ok) {
    if (attempt === 0) {
      console.error("[chat] FAIL:", await stream.text());
      process.exit(1);
    }
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
    firstByteMs ??= Date.now() - firstOpen;
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
      if (typeof rec.at === "string" && Array.isArray(rec.facts)) handleFacts(rec.facts);
      else if (typeof rec.type === "string") handleProgress(rec);
      else if (typeof rec.progress?.type === "string") handleProgress(rec.progress);
    }
  }
  if (!settled) await new Promise((r) => setTimeout(r, 250));
}
clearTimeout(deadline);
const streamed = `first byte ${firstByteMs}ms`;

if (outcome && outcome !== "completed") {
  console.error(`[chat] FAIL: turn outcome ${outcome}`);
  process.exit(1);
}

const reply = [...replyTexts.values()].join(" ").trim();
const failures = [];
if (!settled) failures.push("stream ended before turn.settled");
if (!reply) failures.push("no reply-phase assistant text observed on the stream");
if (!reply.toLowerCase().includes("berkeley")) failures.push("reply does not mention Berkeley");
if (toolNames.size === 0) failures.push("no call.requested events observed");
if (failures.length > 0) {
  console.error("[chat] FAIL:", failures.join("; "));
  console.error(`[chat] tools seen: ${[...toolNames].join(", ") || "(none)"}`);
  console.error(`[chat] reply excerpt: ${reply.slice(0, 400)}`);
  process.exit(1);
}
console.log(`[chat] streamed ${streamed}; tool calls: ${[...toolNames].join(", ")}`);
console.log(`[chat] reply excerpt: ${reply.slice(0, 280).replace(/\n+/g, " ")}`);
console.log("[chat] PASS: real turn streamed through the /api/eve proxy");
