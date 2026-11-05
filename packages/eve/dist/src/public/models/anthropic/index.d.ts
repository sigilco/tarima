import type { LanguageModel } from "ai";
/** Creates a direct Anthropic model. Uses ANTHROPIC_API_KEY, or /login credentials in local development. */
export declare function anthropic(model?: string): Exclude<LanguageModel, string>;
