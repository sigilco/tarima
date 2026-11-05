import type { DecisionModel } from "#ai/decision-types.js";
import { type DynamicModelContext, type DynamicSentinel } from "#dynamic/definition.js";
import type { AgentModelOptionsDefinition, PublicAgentDynamicModelResult, PublicAgentModelSelectionDefinition, PublicAgentStaticModelDefinition } from "#shared/agent-definition.js";
type AutoModelSelection = PublicAgentStaticModelDefinition | PublicAgentModelSelectionDefinition;
/** An option: a model ID, with its description, or a model selection with one. */
type AutoOption = string | (PublicAgentModelSelectionDefinition & {
    readonly description: string;
});
export interface AutoConfig<T extends Readonly<Record<string, AutoOption>> = Readonly<Record<string, AutoOption>>> {
    /** Decision model instance or ID. Defaults to TypeSafe Jev through AI SDK model resolution. */
    readonly model?: DecisionModel;
    /** Provider options for the decision call, not the selected model. */
    readonly modelOptions?: Pick<AgentModelOptionsDefinition, "providerOptions">;
    /** Model selection to use when decision fails. */
    readonly fallback?: AutoModelSelection;
    readonly options: T;
}
/**
 * Selects the agent's model with an AI SDK decision model, once per turn, from the conversation up
 * to the turn's input. Use it as an agent's `model`:
 *
 * ```ts
 * export default defineAgent({
 *   model: auto({
 *     options: {
 *       "openai/gpt-6-sol": "Difficult reasoning and engineering tasks",
 *       "openai/gpt-6-luna": "Routine tasks where fast completion matters",
 *     },
 *   }),
 * });
 * ```
 *
 * The decision is a memo keyed by the turn, so a process that didn't decide uses the same model
 * without deciding again, and a new deployment decides again.
 */
export declare function auto<const T extends Readonly<Record<string, AutoOption>>>(config: AutoConfig<T>): DynamicSentinel<PublicAgentDynamicModelResult, DynamicModelContext>;
export {};
