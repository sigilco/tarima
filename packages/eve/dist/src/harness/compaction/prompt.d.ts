import type { ModelMessage } from "ai";
export declare const COMPACTION_CHECKPOINT_MARKER = "Summary of our conversation so far:";
/** Synthetic resumption prompt used when no real user message can be replayed. */
export declare const COMPACTION_RESUMPTION_MESSAGE = "Continue.";
interface CompactionPrompt {
    readonly prompt: string;
    readonly system: string;
}
/** Static prompt text added around checkpoint and conversation content. */
export declare const COMPACTION_PROMPT_ENVELOPE: {
    prompt: string;
    system: string;
};
/**
 * Builds the compaction model input from framework-owned checkpoint state and
 * older messages.
 *
 * Conversational text is rendered verbatim. When `transcriptBudgetTokens` is
 * set and the rendered prompt exceeds it, conversational text is capped at
 * {@link DEGRADED_TEXT_LIMIT} starting from the oldest entries until the
 * prompt fits; the previous checkpoint is never truncated.
 */
export declare function createCompactionPrompt(input: {
    readonly messages: readonly ModelMessage[];
    readonly previousCheckpoint: string | undefined;
    readonly transcriptBudgetTokens?: number;
}): CompactionPrompt;
export declare const TRANSCRIPT_PAYLOAD_LIMIT = 2000;
/**
 * The text a tool-result output is measured and clipped by, in history
 * capping and in the summarizer transcript alike: a text or error-text
 * output is its value, any other output its JSON. Sharing it keeps a capped
 * history result whole when the summarizer renders it.
 */
export declare function serializeToolResultOutput(output: unknown): string;
/**
 * Replaces the file parts of a `content` tool output with their text stubs,
 * leaving every other output shape untouched. History capping uses this so a
 * capped content output can never carry — or truncate into — a raw payload;
 * the stub matches the one the summarizer transcript renders.
 */
export declare function stubContentOutputFileParts(output: unknown): unknown;
export declare function sliceUtf16Safe(value: string, limit: number): string;
/**
 * Keeps the head and tail of an oversized tool payload, never exceeding
 * `limit`. Tool output often ends with what matters most: the failing test,
 * the error, or the exit code that `bash` reports last.
 */
export declare function clipMiddleUtf16Safe(value: string, limit: number): string;
export {};
