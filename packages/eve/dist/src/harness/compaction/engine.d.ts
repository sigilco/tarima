import type { ModelMessage } from "ai";
import type { CompactionConfig, CompactionState } from "#harness/types.js";
/**
 * Best available input-token count: the model-reported count from the last
 * step, plus a rough character-based estimate of whatever messages have been
 * appended since.
 */
export declare function getInputTokenCount(messages: readonly ModelMessage[], config: CompactionState, requestEnvelopeTokens?: number, previousEnvelopeTokens?: number): number;
/** The settings without the last measured prompt, which a rewritten history no longer matches. */
export declare function withoutPromptMeasurement(config: CompactionState): CompactionState;
/**
 * The settings with a model-reported prompt measurement and the envelope around it. Without a
 * usable measurement, the next count is an estimate, and no envelope baseline applies.
 */
export declare function withPromptMeasurement(config: CompactionState, measured: {
    readonly inputTokens?: number;
    readonly promptMessageCount?: number;
    readonly requestEnvelopeTokens?: number;
}): CompactionState;
/**
 * Returns true when the message history and fixed compaction-prompt envelope
 * exceed the compaction threshold.
 */
export declare function shouldCompact(messages: readonly ModelMessage[], config: CompactionConfig, requestEnvelopeTokens?: number, previousEnvelopeTokens?: number): boolean;
/** Summarizes one compaction prompt with the compaction model, returning the summary text. */
export type CompactionSummarizer = (prompt: {
    readonly messages: ModelMessage[];
    readonly system: string;
}) => Promise<string>;
/**
 * Compacts messages by escalation: try each {@link CompactionHeuristic} in
 * order, then fall back to summarizing the older region with the compaction
 * model — keeping the recent tail verbatim when it fits, degrading it to
 * text-only, then shrinking the window.
 */
export declare function compactMessages(messages: ModelMessage[], config: CompactionConfig, summarize: CompactionSummarizer, forceSummary?: boolean, historyInputTokenCount?: number, 
/**
 * Whether a request is waiting on the next model call. Between turns every request has its
 * answer, and the next turn's input follows the summary: nothing is replayed or prompted.
 */
resume?: boolean): Promise<ModelMessage[]>;
