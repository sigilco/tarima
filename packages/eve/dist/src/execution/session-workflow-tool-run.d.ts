import type { AppliedRunMessage } from "#execution/tools/workflow/apply-run-messages-step.js";
import { type WorkflowToolRunMessage } from "#execution/tools/workflow/messages.js";
import type { SessionStateCursor } from "#execution/session/state-cursor.js";
import { type SessionInboxReader } from "#execution/session-inbox/inbox.js";
import type { RuntimeActionResult } from "#shared/action-types.js";
interface HandlerInput<T> {
    readonly cursor: SessionStateCursor;
    readonly message: T;
}
export declare function isAppliedRunMessage(message: WorkflowToolRunMessage): message is AppliedRunMessage;
/**
 * Removes the applied run messages at the front of the inbox, in arrival
 * order, while `admits` takes them. One batch's caller passes its budget on.
 */
export declare function takeLeadingAppliedRunMessages(inbox: SessionInboxReader, admits?: (message: WorkflowToolRunMessage) => boolean): AppliedRunMessage[];
/**
 * Handles a run message the session does not apply as it reads it: a
 * question, its withdrawal, or an `execute` run's outcome.
 */
export declare function handleWorkflowToolRunMessage(input: HandlerInput<Exclude<WorkflowToolRunMessage, AppliedRunMessage>>): Promise<RuntimeActionResult | undefined>;
export {};
