import { type SessionBoot } from "#execution/session/program.js";
import { type SessionInboxHandle } from "#execution/session-inbox/inbox.js";
import type { InitialWorkflowEntryInput, WorkflowEntryInput, WorkflowEntryResult } from "#execution/session/entry-input.js";
/**
 * Long-lived workflow entrypoint. Handles both root sessions and
 * delegated child sessions: root sessions expose only parent
 * control-plane events; delegated children publish their full progress
 * on a child stream and resume the parked parent with a
 * `subagent-result` on completion.
 *
 * The current owner directly executes every turn. An idle owner can transfer
 * its settled checkpoint and hooks to an exact successor deployment while the
 * original run remains parked as the public stream anchor.
 */
export declare function workflowEntry(input: WorkflowEntryInput): Promise<WorkflowEntryResult>;
interface BootOutcome {
    readonly inbox: SessionInboxHandle;
    readonly session: SessionBoot;
}
/** Returns `undefined` when a competing continuation owner already exists. */
export declare function bootInitialOwner(input: InitialWorkflowEntryInput, sessionId: string): Promise<BootOutcome | undefined>;
export {};
