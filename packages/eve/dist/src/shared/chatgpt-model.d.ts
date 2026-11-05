import type { ModelRouting } from "./agent-definition.js";
export declare const DEFAULT_CHATGPT_MODEL_ID: "gpt-6-luna-fast";
export declare const CHATGPT_MODEL_SELECTION_PREFIX = "chatgpt/";
/** Returns the bare OpenAI model id encoded by a setup-facing ChatGPT selection. */
export declare function parseChatGptModelSelection(selection: string): string | undefined;
export declare function isChatGptModelRouting(routing: ModelRouting | null | undefined): boolean;
/** Normalizes the model argument accepted by the public `chatgpt()` helper. */
export declare function normalizeChatGptModelId(model: string): string | undefined;
/**
 * Codex has no `-fast` model slugs: it serves Fast mode as the `priority`
 * service tier on the base model and rejects `gpt-6-luna-fast` outright.
 */
export declare function parseChatGptFastModelId(modelId: string): {
    slug: string;
    fast: boolean;
};
