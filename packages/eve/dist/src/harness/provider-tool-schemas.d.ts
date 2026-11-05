import type { JsonObject } from "#shared/json.js";
export declare const WEB_SEARCH_TOOL_NAME = "web_search";
export declare function resolveWebSearchActivityLabel(input: unknown): string;
/**
 * Output schema for OpenAI's provider-managed `webSearch` tool.
 */
export declare const WEB_SEARCH_OPENAI_OUTPUT_SCHEMA: JsonObject;
/**
 * Output schema for Anthropic's stable provider-managed `webSearch_20250305` tool.
 */
export declare const WEB_SEARCH_ANTHROPIC_OUTPUT_SCHEMA: JsonObject;
/**
 * Output schema for Google's provider-managed `googleSearch` grounding tool.
 */
export declare const WEB_SEARCH_GOOGLE_OUTPUT_SCHEMA: JsonObject;
/**
 * Output schema for AI Gateway's provider-managed `exaSearch` tool.
 */
export declare const WEB_SEARCH_EXA_OUTPUT_SCHEMA: JsonObject;
/**
 * Output schema for AI Gateway's provider-managed `parallelSearch` tool.
 */
export declare const WEB_SEARCH_PARALLEL_OUTPUT_SCHEMA: JsonObject;
