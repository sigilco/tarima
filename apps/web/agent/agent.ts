import { defineAgent } from "eve";
import { createOpenAI } from "eve/compiled/openai";

/**
 * The bifrost gateway speaks the OpenAI wire protocol on /v1, so the
 * vendored (pre-compiled) openai provider points at it. The virtual key
 * arrives as BIFROST_VK; the gateway URL is BIFROST_BASE_URL. The model
 * id is any gateway model (TARIMA_AGENT_MODEL); its context window is
 * declared beside it because gateway model ids carry no AI Gateway
 * metadata for eve's compaction planner.
 */
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
  model: provider.chat(process.env.TARIMA_AGENT_MODEL ?? "zai-coding-plan/glm-5"),
  modelContextWindowTokens: AGENT_CONTEXT_WINDOW_TOKENS,
  build: {
    // better-sqlite3 is a native addon: keep it out of the authored
    // bundle so Node resolves the installed prebuild at runtime.
    externalDependencies: ["better-sqlite3"],
  },
});
