import type { SessionCapabilities } from "#channel/types.js";
import type { DurableSessionState } from "#execution/durable-session-store.js";
import type { HarnessModelMessage } from "#harness/messages.js";
import type { SessionInboxHandle, SessionInboxPayload } from "#execution/session-inbox/inbox.js";
import type { TurnSelection } from "#execution/session/input-queue.js";
import type { WorkflowEntryResult } from "#execution/session/entry-input.js";
import type { AgentWorkflowRetentionDefinition } from "#shared/agent-definition.js";
/**
 * Cross-deployment checkpoint contract. The successor may run a different eve
 * build than the owner that produced it; bump when any field changes shape so
 * an older successor rejects the handoff instead of misreading state.
 *
 * A successor accepts checkpoints back to `MIN_SESSION_CHECKPOINT_VERSION` and
 * refuses older ones; a bump that keeps its predecessor readable adds the upgrade
 * in `checkpoint-migrations.ts`.
 */
export declare const SESSION_CHECKPOINT_VERSION = 19;
/** Everything a successor needs to continue an idle session. Hooks are derived from the state. */
export interface SessionCheckpoint {
    readonly admittedDeliveryKeys: readonly string[];
    readonly version: typeof SESSION_CHECKPOINT_VERSION;
    readonly capabilities?: SessionCapabilities;
    readonly history: HarnessModelMessage[];
    readonly retention?: AgentWorkflowRetentionDefinition;
    readonly serializedContext: Record<string, unknown>;
    readonly sessionState: DurableSessionState;
    readonly sessionTimeoutMs: number | false;
}
export type SessionOwnerActivation = {
    readonly kind: "active";
} | {
    readonly kind: "incompatible";
    readonly reason: "checkpoint-version";
    /** Version 3: the successor run that gave this verdict. */
    readonly runId?: string;
    /** Commands accepted by partial successor claims before it rejected the checkpoint. */
    readonly payloads: readonly SessionInboxPayload[];
} | {
    readonly kind: "failed";
    /**
     * Version 3: the successor took some of the session's hooks before it
     * failed. The owner takes them back and waits for their handover.
     */
    readonly claimedHooks?: boolean;
    readonly error: unknown;
    /** Version 3: the successor run that gave this verdict. */
    readonly runId?: string;
    /** Commands accepted by partial successor claims before startup failed. */
    readonly payloads: readonly SessionInboxPayload[];
};
interface SessionHandoffInput {
    readonly checkpoint: Omit<SessionCheckpoint, "admittedDeliveryKeys" | "history" | "serializedContext" | "sessionState" | "version">;
    readonly deploymentId: string;
    readonly inbox: SessionInboxHandle;
    readonly isInitialOwner: boolean;
    readonly sessionId: string;
    readonly sessionWritable: WritableStream<Uint8Array>;
}
export declare function sessionAnchorToken(sessionId: string): string;
/** Only one run per attempt can hold this; a successor that loses it exits untouched. */
export declare function handoffLeaseToken(attemptKey: string): string;
/**
 * Measured from the lease's creation and far beyond any queue delay, so a
 * duplicate candidate that boots late still finds the token taken.
 */
export declare const HANDOFF_LEASE_RETENTION = "7d";
type SessionTransferOutcome = {
    readonly kind: "transferred";
} | {
    readonly kind: "retained";
    readonly reason: SessionRetainedReason;
};
type SessionRetainedReason = "same-deployment" | "missing-deployment" | "not-idle" | "busy" | "activation-failed" | "checkpoint-incompatible" | "known-incompatible" | "unsupported-world";
type SessionTransferState = Pick<SessionCheckpoint, "admittedDeliveryKeys" | "history" | "serializedContext" | "sessionState">;
/**
 * Sends `payloads` as handover parts, one payload per part: each was accepted
 * on its own, so no part exceeds what the World already took. Every part is
 * retried with backoff until it is delivered or the session has ended: the
 * receiver reads nothing until the final part lands, and dropping a part
 * would lose a message the session accepted.
 */
export declare function sendSessionHandover(input: {
    readonly attemptKey: string;
    readonly payloads: readonly SessionInboxPayload[];
    readonly sessionId: string;
}): Promise<void>;
/**
 * The sole boundary for moving an idle session to a successor run: on another
 * exact deployment when newer code accepts a delivery, or on this deployment
 * after compaction so no single run's event log grows with the session.
 * Constructed once per owner; each `try*` method attempts one transfer.
 *
 * The owner never releases its hooks. The successor force-claims every one of
 * them, and the takeover itself is the success signal: the owner then hands
 * over whatever it accepted meanwhile and exits. Until the attempt settles
 * the owner runs no turn.
 */
export declare class SessionHandoff {
    private readonly input;
    private anchor;
    /** Deployments that rejected this session's checkpoint during this owner run. */
    private readonly incompatibleTargetDeploymentIds;
    /** Counts this run's attempts; replay repeats the same sequence. */
    private attempts;
    /** The World cannot force-claim hooks, so no attempt can ever succeed. */
    private worldUnsupported;
    constructor(input: SessionHandoffInput);
    /**
     * Attempts to move the session to the selected delivery's deployment. The
     * outcome states whether the successor took over or this owner retained the
     * session. Candidate failures recover locally rather than escaping.
     */
    tryTransfer(selection: TurnSelection, state: SessionTransferState): Promise<SessionTransferOutcome>;
    /**
     * Attempts to move a session that compacted to a fresh run on this
     * deployment. The caller guarantees no input is waiting; the successor
     * parks until the next one arrives.
     */
    tryCompactionTransfer(state: SessionTransferState): Promise<SessionTransferOutcome>;
    tryPrewarmTransfer(state: SessionTransferState, targetDeploymentId: string, sessionTimeoutDeadline: Date | undefined): Promise<SessionTransferOutcome>;
    private transfer;
    /**
     * The session was taken over while no attempt was open. This run leaves as
     * after a transfer, without finalizing the stream the new owner now writes.
     */
    adoptTakeover(): Promise<{
        readonly kind: "transferred";
    }>;
    /**
     * Claims the attempt's lease. `gaveUpRunId` is the candidate whose outcome
     * the owner is acting on: holding the lease, it can no longer take over.
     */
    private fenceAttempt;
    /** Forwards what this run accepted but never read to the run that took the session over. */
    private handOver;
    /**
     * Takes back every address a candidate that gave up may hold. Forced claims
     * replace this run's own hooks, so this holds whether or not a pump has
     * observed the candidate's claim yet.
     */
    private holdEveryToken;
    private recoverFromSilentCandidate;
    /** Keeps the session after a candidate's verdict, taking back any hook it claimed. */
    private recover;
    private ensureAnchor;
    /** After a transfer, the original run parks until the final owner reports the session result. */
    awaitAnchoredResult(): Promise<WorkflowEntryResult>;
    disposeAnchor(): Promise<void>;
    private reportRetained;
}
export {};
