import type { MessageContent } from "#shared/message-content.js";
import type { HarnessStepInput } from "#harness/types.js";
import type { SessionView } from "#protocol/session-projection/tables.js";
type StaleResponseConversion = {
    readonly kind: "unchanged";
    readonly stepInput?: HarnessStepInput;
} | {
    readonly displayMessage: MessageContent;
    readonly kind: "converted";
    readonly stepInput: HarnessStepInput;
};
/**
 * Filter pass: removes stale answers to session-limit continuation prompts
 * from the step input before any stale handling runs.
 *
 * These are dropped rather than converted: surfacing a stale "Stop" as
 * conversational prose would read fail-open, and a stale grant must not
 * extend any budget — a currently pending prompt (if any) stays parked and
 * re-raises. Stripping the responses also keeps them from resolving (and
 * clearing) a pending batch they never answered. Answers to a currently
 * pending continuation prompt pass through untouched.
 */
export declare function dropStaleSessionLimitContinuationResponses(input: {
    readonly pendingRequestIds: ReadonlySet<string>;
    readonly stepInput?: HarnessStepInput;
}): HarnessStepInput | undefined;
/**
 * Transformation pass: a response is stale when its request ID is not in
 * the currently pending HITL batch — the request was already answered,
 * cleared by a follow-up message, or cancelled.
 *
 * Responses for pending requests stay structured; stale responses become
 * plain user-message text. A stale response never reaches structured HITL
 * processing, so a stale approval cannot authorize an earlier tool call.
 * Request details the session still knows are best-effort model context.
 *
 * Assumes {@link dropStaleSessionLimitContinuationResponses} already ran:
 * stale continuation answers must never reach this conversion.
 */
export declare function convertStaleResponsesToUserMessage(input: {
    readonly pendingRequestIds: ReadonlySet<string>;
    /** The session's tables: the requests it still knows, closed ones included. */
    readonly view: SessionView;
    readonly stepInput?: HarnessStepInput;
}): StaleResponseConversion;
export {};
