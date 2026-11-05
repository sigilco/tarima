/**
 * Why one model run ended. `tool-calls` is the only one the turn continues after, unless
 * steering superseded the run, which ends `other` and continues with the next run. The wire
 * carries it as an open string on `model.settled`.
 */
export type AssistantStepFinishReason = "content-filter" | "error" | "length" | "other" | "stop" | "tool-calls";
/** Maps an AI SDK finish reason to the eve-owned union. */
export declare function normalizeAssistantStepFinishReason(value: string | undefined): AssistantStepFinishReason;
