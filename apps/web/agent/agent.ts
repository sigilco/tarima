import { defineAgent } from "eve";
import { createOpenAI } from "eve/compiled/openai";
import { mockModel } from "eve/evals";
import { agentApprovalPolicy } from "./approval";

/**
 * The bifrost gateway speaks the OpenAI wire protocol on /v1, so the
 * vendored (pre-compiled) openai provider points at it. The virtual key
 * arrives as BIFROST_VK; the gateway URL is BIFROST_BASE_URL. The model
 * id is any gateway model (TARIMA_AGENT_MODEL); its context window is
 * declared beside it because gateway model ids carry no AI Gateway
 * metadata for eve's compaction planner.
 *
 * TARIMA_AGENT_STUB=1 swaps in eve's deterministic mock model instead:
 * no network, no key, a fixed reply per turn. The smoke gate
 * (scripts/smoke.ts) and `mise run dev` without a BIFROST_VK use it.
 */
const useStub = process.env.TARIMA_AGENT_STUB === "1";

/**
 * The stub responder (batch dev-memory-e2e): deterministic, stub-mode
 * only, and tool-capable. `remember: <fact>` emits a real
 * `memory__save_memory` tool call with the fact as `text`; a recall
 * question (`what do you remember`) answers from the recalled memory
 * block eve injected at turn start, or says nothing is saved. Anything
 * else keeps the old echo reply. Tool availability is checked so the
 * responder degrades to plain text when the memory slot is off (no
 * authenticated principal).
 */
export const stubResponder: Parameters<typeof mockModel>[0] = (request) => {
  const last = request.lastUserMessage ?? "";
  const remember = /^remember:\s*(.+)$/i.exec(last.trim());
  if (remember && request.tools.some((t) => t.name === "memory__save_memory")) {
    return {
      text: `Saved to memory: ${remember[1]!.trim()}`,
      toolCalls: [{ name: "memory__save_memory", input: { text: remember[1]!.trim() } }],
    };
  }
  if (/what do you remember/i.test(last)) {
    const recalled = request.messages
      .filter((m) => m.role === "user" && m.text.startsWith("# Persistent memories"))
      .flatMap((m) => m.text.split("\n").filter((line) => /^\d+: /.test(line)));
    return recalled.length > 0
      ? `From memory: ${recalled.map((line) => line.replace(/^\d+: /, "")).join("; ")}`
      : "Nothing is saved in memory yet. Tell me with: remember: <fact>";
  }
  return `Stub reply: ${last}`;
};

const provider = createOpenAI({
  apiKey: process.env.BIFROST_VK,
  baseURL: process.env.BIFROST_BASE_URL ?? "http://127.0.0.1:8317/v1",
});

const AGENT_CONTEXT_WINDOW_TOKENS = Number.parseInt(
  process.env.TARIMA_AGENT_CONTEXT_TOKENS ?? "131072",
  10,
);

export default defineAgent({
  // .chat targets /v1/chat/completions: the gateway's coding-plan models
  // stream reasoning there without the summary-delta events that break
  // the compiled responses provider's schema on this gateway.
  model: useStub
    ? mockModel(stubResponder)
    : provider.chat(process.env.TARIMA_AGENT_MODEL ?? "zai-coding-plan/glm-5"),
  modelContextWindowTokens: AGENT_CONTEXT_WINDOW_TOKENS,
  // Agent-wide approval gate (see approval.ts): read-only tools never
  // prompt; the outbound family always does. Stacks with a tool's own
  // `approval` (stricter wins).
  approval: agentApprovalPolicy,
  build: {
    // better-sqlite3 is a native addon: keep it out of the authored
    // bundle so Node resolves the installed prebuild at runtime.
    externalDependencies: ["better-sqlite3"],
  },
});
