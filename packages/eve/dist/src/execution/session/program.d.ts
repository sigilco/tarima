import type { DeliverHookPayload, SessionCapabilities, TurnCaller } from "#channel/types.js";
import type { AgentWorkflowRetentionDefinition } from "#shared/agent-definition.js";
import type { DurableSessionState } from "#execution/durable-session-store.js";
import type { HarnessModelMessage } from "#harness/messages.js";
import { type TurnControl } from "#execution/session/turn-control.js";
import { type SessionInboxHandle } from "#execution/session-inbox/inbox.js";
import type { SessionTimeoutControl } from "#execution/session/timeout-control.js";
import type { WorkflowEntryResult } from "#execution/session/entry-input.js";
/**
 * Who to tell when this owner exits. The original run anchors the public
 * stream itself; a successor signals the original run. A `self` anchor may
 * also name a `notify` step that runs with the final result, which lets an
 * importer settle whatever predecessor still holds the stream open.
 */
export type SessionAnchor = {
    readonly kind: "self";
    readonly notify?: (result: WorkflowEntryResult) => Promise<void>;
} | {
    readonly kind: "successor";
};
/** What an owner does before it first waits on its inbox. */
export type SessionStart = 
/** Runs a turn first; `input` is absent for a session started without a message. */
{
    readonly kind: "turn";
    readonly input: DeliverHookPayload | undefined;
}
/**
 * A prewarmed session parks on the inbox before any turn, session event, or
 * session hook, while its session prewarmers run beside the wait.
 */
 | {
    readonly kind: "first-message";
}
/** A successor that received a settled session waits for its next input. */
 | {
    readonly kind: "parked";
};
export interface SessionBoot {
    readonly admittedDeliveryKeys: readonly string[];
    readonly anchor: SessionAnchor;
    readonly caller: TurnCaller | undefined;
    readonly capabilities?: SessionCapabilities;
    /** Compacts the history before the first action, for a session an earlier build recorded. */
    readonly compactFirst?: boolean;
    readonly deploymentId: string;
    readonly history: HarnessModelMessage[];
    readonly initialTurnControl?: TurnControl;
    readonly start: SessionStart;
    readonly retention?: AgentWorkflowRetentionDefinition;
    readonly serializedContext: Record<string, unknown>;
    readonly sessionId: string;
    readonly sessionState: DurableSessionState;
    readonly sessionTimeoutControl?: SessionTimeoutControl;
    readonly sessionTimeoutMs: number | false;
    readonly sessionWritable: WritableStream<Uint8Array>;
}
/** Runs an already prepared owner against its session's existing stream. */
export declare function runPreparedSession(boot: SessionBoot, inbox: SessionInboxHandle): Promise<WorkflowEntryResult>;
/**
 * Terminal path for a boot that failed before the session loop could run.
 * The caller is re-resolved from context because no turn ever bound it.
 */
export declare function failSession(input: {
    readonly error: unknown;
    readonly serializedContext: Record<string, unknown>;
    readonly sessionId: string;
    readonly sessionState: DurableSessionState | undefined;
    readonly sessionWritable: WritableStream<Uint8Array>;
}): Promise<never>;
