import { type HarnessModelMessage, type UserModelMessage } from "#harness/messages.js";
import { getTurnClientContextState } from "#harness/turn-client-context.js";
import type { HarnessStepInput } from "#harness/types.js";
import type { Step } from "./context.js";
/**
 * Settles the calls the runtime ran for parked steps. Returns `undefined` while some are still
 * running: input queued behind them waits until they have. Otherwise returns the step's input
 * without the results it settled, and whether the step waited on any.
 */
export declare function settleRuntimeWork(step: Step, input: HarnessStepInput | undefined): Promise<{
    readonly input: HarnessStepInput | undefined;
    readonly waited: boolean;
} | undefined>;
/** The turn's input as the model reads it. */
export interface TurnInput {
    readonly turnId: string;
    /** Context the client sent for this turn, which never joins history. */
    readonly clientContext: readonly string[] | undefined;
    readonly storedClientContext: ReturnType<typeof getTurnClientContextState>;
    readonly ephemeral: readonly UserModelMessage[];
    /** Imported history, the context entries, and the message, in history order. */
    readonly messages: readonly HarnessModelMessage[];
    /** The input carries a user's message, which follows tool results across a boundary. */
    readonly hasUserMessage: boolean;
    /** The message with its attachments staged, so input queued again isn't staged twice. */
    readonly message: HarnessStepInput["message"];
}
/**
 * Prepares the turn's input: client and context entries, and the message with its attachments
 * staged to the sandbox. A message a plain-text answer consumed never reaches the model.
 */
export declare function prepareTurnInput(step: Step, input: HarnessStepInput | undefined, options: {
    readonly consumedMessage: boolean;
}): Promise<TurnInput>;
/** The turn's input as it follows tool results: a user message needs a boundary before it. */
export declare function followingToolResults(turn: TurnInput): HarnessModelMessage[];
