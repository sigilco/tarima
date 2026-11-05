import type { LanguageModel } from "ai";
/**
 * Creates a language model billed to the local ChatGPT subscription instead
 * of an API key. Sign in through `/login` in `eve dev`.
 *
 * Defaults to `gpt-6-luna-fast`. Pass a bare OpenAI model slug or an
 * `openai/`-prefixed id to override it; the Codex backend serves OpenAI models
 * only, so any other provider-qualified id is rejected. Model availability is
 * enforced by the Codex backend per account at call time, not at compile time.
 *
 * eve uses Codex app-server when the Codex CLI is installed. If the binary is
 * not found, eve stores and refreshes its own local credentials instead. This
 * model works in local dev and fails in a deployment.
 * Branch on environment for production:
 *
 * ```ts
 * export default defineAgent({
 *   model:
 *     process.env.NODE_ENV === "production"
 *       ? "anthropic/claude-sonnet-4.6"
 *       : chatgpt(),
 * });
 * ```
 */
export declare function chatgpt(model?: string): Exclude<LanguageModel, string>;
/** Creates a direct OpenAI model. Uses OPENAI_API_KEY, or /login credentials in local development. */
export declare function openai(model?: string): Exclude<LanguageModel, string>;
