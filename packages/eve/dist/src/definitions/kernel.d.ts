import type { ModelMessage } from "ai";
import type { ContextContainer } from "#context/container.js";
import type { ContextReader } from "#context/key.js";
import type { WrittenEvent } from "#execution/publish-session-events.js";
import { type CommitInput, type Contribution, type Definition, type DefinitionContext } from "./definition.js";
/** Where eve asks the definitions. */
export type Where = Pick<DefinitionContext, "step" | "call" | "commit"> & Partial<Pick<DefinitionContext, "history" | "signal">>;
/**
 * What each definition adds, where eve asks. `evaluate` evaluates what they keep, each at most once;
 * `read` reads what the latest evaluation kept, evaluating again only what this process lacks the
 * code of.
 */
export declare function contributionsOf(definitions: readonly Definition[], container: ContextReader, where: Where, mode?: "evaluate" | "read"): Contribution[];
export interface RunEffectsInput {
    readonly written: readonly WrittenEvent[];
    readonly abortSignal?: AbortSignal;
    /** The conversation as of this commit, or `undefined` in a step that doesn't hold it. */
    readonly conversation?: readonly ModelMessage[];
    /** Stops the running turn; absent when this commit can't stop one. */
    readonly cancelTurn?: CommitInput["cancelBeforeTurn"];
    readonly cancelBeforeTurn?: CommitInput["cancelBeforeTurn"];
}
/** Runs after every commit: the effects every definition names for it, in definition order. */
export declare function runEffects(ctx: ContextContainer, input: RunEffectsInput): Promise<void>;
/**
 * Takes what a blocking effect threw after the commit that started an operation: the operation
 * then fails before it goes further.
 */
export declare function takeBlockingFailure(ctx: object): unknown;
/** A dynamic value failed to evaluate before a model call: the turn fails. */
export declare class DefinitionFailedError extends Error {
    readonly name = "DefinitionFailedError";
    readonly definition: string;
    constructor(definition: string, error: unknown);
}
/**
 * Prepares a step: on a move to another deployment, discards memos; drops what definitions the
 * bundle no longer has kept; and reads the call as it stands, which evaluates again each kept
 * value whose code this process doesn't hold, so a step that runs a tool call or reaches a
 * connection before its model call has them. Its memos return what they kept, so this asks
 * nothing of the outside world again.
 */
export declare function restoreDefinitions(ctx: ContextContainer, input?: {
    readonly abortSignal?: AbortSignal;
    readonly conversation?: readonly ModelMessage[];
    readonly revision?: string;
}): Promise<void>;
/** Applies what definitions keep to the step's process-local state, such as its connection registry. */
export declare function installDefinitions(ctx: ContextContainer): Promise<void>;
