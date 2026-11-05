import type { CompactionOverLimitError } from "#harness/compaction/over-limit-error.js";
import type { Step } from "#harness/step/context.js";
import type { StepResult } from "#harness/types.js";
import type { ErrorInfo } from "#protocol/session-events/envelope.js";
/** A failed model call as the stream reports it: what a reader can act on, not the SDK's dump. */
export declare function modelCallErrorInfo(error: unknown): ErrorInfo;
/** Exhausted model calls fail the turn; terminal errors end its session as well. */
export declare function reportModelCallFailure(step: Step, error: unknown): Promise<StepResult>;
/**
 * Compaction could not bring the history under the limit. The next attempt
 * would fail the same way, so the session ends with the message instead of
 * the step being retried.
 */
export declare function reportCompactionFailure(step: Step, error: CompactionOverLimitError): Promise<StepResult>;
