import { type LanguageModel, type ModelMessage } from "ai";
import { type StepResult } from "#harness/types.js";
import { type HarnessModelMessage } from "#harness/messages.js";
import { type Step } from "#harness/step/context.js";
/**
 * Throws when the fixed part of the request (instructions, tools, memory)
 * leaves no room for any history: compacting the history cannot help then.
 */
export declare function assertFixedPartFits(input: {
    readonly protectedTokens: number;
    readonly requestEnvelopeTokens: number;
    readonly threshold: number;
}): void;
/**
 * `session.compact()`: summarizes the history, then the session waits. The control is a delivery:
 * it's admitted first, and applied once the history is decided.
 */
export declare function compactHistory(step: Step): Promise<StepResult>;
/**
 * The history the next model call reads, committed: summarized when the call would pass the
 * threshold, a share of the model's window (`agent.ts`'s `compaction.threshold`), counting the
 * summary prompt's own overhead. Returns the messages the call reads, or `undefined` when the
 * history stays. A failure is rethrown, after settling any change it opened; `step.session`
 * counts the summary calls that finished.
 */
export declare function historyBeforeCall(step: Step, input: {
    /** The durable messages the history becomes. */
    readonly messages: readonly HarnessModelMessage[];
    /** The prompt as the model reads it, which the call's size measures. */
    readonly promptMessages: readonly HarnessModelMessage[];
    readonly model: LanguageModel;
    readonly requestEnvelopeTokens: number;
}): Promise<HarnessModelMessage[] | undefined>;
/**
 * Where a compaction during a turn leaves the turn's input: its latest user message, or that
 * message's replay. What the framework adds for the turn goes before it, as on the turn's first
 * step.
 */
export declare function compactedTurnInput<Message extends ModelMessage>(messages: readonly Message[]): Message | undefined;
