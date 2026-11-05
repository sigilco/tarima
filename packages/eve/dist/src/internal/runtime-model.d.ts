import type { LanguageModel } from "ai";
import type { AgentReasoningDefinition, EveLanguageModel } from "#shared/agent-definition.js";
/**
 * Formats an authored agent model reference as an AI Gateway model id.
 *
 * Handles both authored shapes:
 * - A `string` is treated as an already-formatted Gateway id.
 * - An `EveLanguageModel` instance is formatted as `${provider}/${modelId}`.
 *
 * Some providers expose `provider` as a dotted sub-path (e.g. `anthropic.messages`,
 * `openai.responses`) to disambiguate request shapes. The Gateway routes on the
 * top-level provider only, so any segments after the first dot are dropped.
 */
export declare function formatLanguageModelGatewayId(model: string | EveLanguageModel): string;
export declare function isRuntimeLanguageModel(value: unknown): value is EveLanguageModel;
/**
 * Hands an authored model to the AI SDK. `EveLanguageModel` keeps call options opaque so the
 * public surface does not re-export AI SDK types; every value it describes is an AI SDK model.
 */
export declare function toAiSdkLanguageModel(model: string | EveLanguageModel): LanguageModel;
export declare function isAgentReasoningDefinition(value: unknown): value is AgentReasoningDefinition;
