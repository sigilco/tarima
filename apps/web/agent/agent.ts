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
    ? mockModel(({ lastUserMessage }) => `Stub reply: ${lastUserMessage ?? ""}`)
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
