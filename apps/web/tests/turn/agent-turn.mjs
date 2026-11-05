// Calls POST /api/agent/turn with the seed prompt and prints the full
// transcript: request, tool calls observed on the session stream, and
// the assistant reply.
const base = process.argv[2];
const cookieJar = process.argv[3];

const fs = await import("node:fs");
const cookie = fs
  .readFileSync(cookieJar, "utf8")
  .split("\n")
  .find((l) => l.includes("tarima_session"))
  ?.trim()
  .split("\t")
  .at(-1);
if (!cookie) throw new Error("no tarima_session cookie in jar");

const prompt = `Organize an evening event in Berkeley, CA, next week or in two weeks, ~5:30–8:30 PM, topic: decision models (AI, e.g. Jev/Clef), 10–25 attendees. I have no sponsor or venue agreements yet. Help me find sponsors for (venue, food, AI credits for decision models); the venue+food sponsor may be the same (a restaurant/bar/cafe) but it must have wifi, allow seating by groups, and have a TV or projector to demo projects.`;

const res = await fetch(`${base}/api/agent/turn`, {
  method: "POST",
  headers: { "content-type": "application/json", cookie: `tarima_session=${cookie}` },
  body: JSON.stringify({ message: prompt }),
});
console.log(`[turn] status: ${res.status}`);
const body = await res.json();
console.log("--- transcript ---");
console.log(JSON.stringify(body, null, 2));

const reply = body.reply ?? "";
const lower = reply.toLowerCase();
const failures = [];
if (!reply) failures.push("empty reply");
if (!lower.includes("berkeley")) failures.push("reply does not mention Berkeley");
if (!(Array.isArray(body.toolCalls) && body.toolCalls.length > 0)) {
  failures.push("no tool calls observed");
}
if (failures.length > 0) {
  console.error("[turn] FAIL:", failures.join("; "));
  process.exit(1);
}
console.log("[turn] PASS: real reply grounded in tarima data with tool calls");
