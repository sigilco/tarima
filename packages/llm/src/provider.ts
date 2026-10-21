import { createOpenAiCompatible } from "./openai-compatible";
import type { OpenAiCompatibleClient } from "./openai-compatible";
import {
  buildDraftOutreachPrompt,
  buildParseReplyPrompt,
  extractJson,
  validateOutreachDraft,
  validateParsedReply,
} from "./tasks";
import type { DraftOutreachInput, LlmProvider, OutreachDraft, ParsedReply } from "./types";

export interface LlmEnv {
  /** OpenAI-compatible base url, e.g. https://host/v1 */
  baseUrl?: string;
  apiKey?: string;
  /** Cheap fast model used for parseReply. */
  instructModelId?: string;
  /** Stronger reasoning model used for draftOutreach. */
  thinkingModelId?: string;
}

export interface LlmProviderOptions {
  /** Injectable for tests. Defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

/**
 * Build the LLM provider from env. Model per task: parseReply uses the
 * instruct model (fast and cheap, it is a classification), draftOutreach
 * uses the thinking model (writing is the expensive half).
 */
export function createLLM(env: LlmEnv = {}, options: LlmProviderOptions = {}): LlmProvider {
  const baseUrl = env.baseUrl ?? process.env.LLM_BASE_URL ?? "";
  const apiKey = env.apiKey ?? process.env.LLM_API_KEY ?? "";
  const instructModelId = env.instructModelId ?? process.env.LLM_INSTRUCT_MODEL_ID ?? "";
  const thinkingModelId = env.thinkingModelId ?? process.env.LLM_THINKING_MODEL_ID ?? "";

  let client: OpenAiCompatibleClient | null = null;
  const getClient = (): OpenAiCompatibleClient => {
    if (!client) {
      if (!baseUrl || !apiKey) {
        throw new Error("llm is not configured: LLM_BASE_URL and LLM_API_KEY are required");
      }
      client = createOpenAiCompatible({ baseUrl, apiKey, fetchImpl: options.fetchImpl });
    }
    return client;
  };

  return {
    async parseReply(body: string, goal: Record<string, unknown>): Promise<ParsedReply> {
      if (!instructModelId) {
        throw new Error("llm is not configured: LLM_INSTRUCT_MODEL_ID is required");
      }
      const prompt = buildParseReplyPrompt(body, goal);
      const res = await getClient().complete({
        model: instructModelId,
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
        json: true,
        temperature: 0,
      });
      return validateParsedReply(extractJson(res.content));
    },

    async draftOutreach(input: DraftOutreachInput): Promise<OutreachDraft> {
      if (!thinkingModelId) {
        throw new Error("llm is not configured: LLM_THINKING_MODEL_ID is required");
      }
      const prompt = buildDraftOutreachPrompt(input);
      const res = await getClient().complete({
        model: thinkingModelId,
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user },
        ],
        json: true,
        temperature: 0.4,
      });
      return validateOutreachDraft(extractJson(res.content));
    },
  };
}
