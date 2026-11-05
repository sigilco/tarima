import { ContextKey, type ContextAccessor, type ContextReader } from "#context/key.js";
import { type LiveDynamicModelSelection } from "#context/keys.js";
import type { RuntimeModelReference } from "#runtime/agent/bootstrap.js";
import type { CompiledBundle } from "#runtime/sessions/runtime-context-keys.js";
import { type Contribution, type Definition } from "./definition.js";
/** A dynamic `model` failed to choose a model: the model call that needs it fails. */
export declare class DynamicModelSelectionError extends Error {
    readonly code = "EVE_DYNAMIC_MODEL_SELECTION_FAILED";
    readonly name = "DynamicModelSelectionError";
    constructor(error: unknown);
}
export declare function isDynamicModelSelectionError(error: unknown): error is DynamicModelSelectionError;
/** The model a call runs: its reference, and the provider the process holds for it, if any. */
export type ModelChoice = LiveDynamicModelSelection;
/**
 * An agent's dynamic `model` field: its function returns the model, as a gateway ID, a provider
 * object, or `{ model, reasoning?, modelContextWindowTokens?, modelOptions? }`. It's chosen before
 * every other value evaluates, so each can read `ctx.model`. A model call needs a model, so `null`
 * fails it.
 */
export declare function loadModelDefinition(bundle: CompiledBundle): Promise<Definition | undefined>;
/**
 * The model the session chose last, as its definitions decided before a model call. Readers
 * outside the call, such as `ctx.model`, read it.
 */
export declare const ChosenModelKey: ContextKey<{
    readonly reference: RuntimeModelReference;
}>;
/** What the session's definitions decide the model call runs, and records it as the session's choice. */
export declare function chooseModel(contributions: readonly Contribution[], ctx: ContextAccessor): Promise<ModelChoice | undefined>;
/** The session's model outside a model call: the one it chose last, else the one it was given. */
export declare function currentModel(ctx: Pick<ContextReader, "get">): RuntimeModelReference | undefined;
export declare function effectiveModelId(ctx: Pick<ContextReader, "get">): string | undefined;
/** `agent.ts`'s model, which every dynamic choice after it may replace. */
export declare function agentModel(bundle: CompiledBundle): Definition | undefined;
/** The model a session's parent gave it, which no definition of the session's own replaces. */
export declare const parentModel: Definition;
