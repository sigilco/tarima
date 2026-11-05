import type { SessionHandoverPayload } from "#execution/session-inbox/inbox.js";
import type { SessionCheckpointMigration } from "#execution/session/checkpoint-migrations.js";
import { type SessionCheckpoint, type SessionOwnerActivation } from "#execution/session/handoff.js";
import { type SessionHandoffStart } from "#execution/session/entry-input.js";
export type SuccessorStartInput = SessionHandoffStart & {
    readonly activationToken: string;
    /** Original run whose stream stays the public session stream. */
    readonly anchorRunId: string;
    readonly attemptKey: string;
    readonly checkpoint: SessionCheckpoint;
    readonly hookTokens: readonly string[];
    readonly sessionWritable: WritableStream<Uint8Array>;
    /** The owner starting the successor, which hands over what it accepts meanwhile. */
    readonly sourceRunId: string;
    readonly targetDeploymentId: string;
};
export type SuccessorStart = {
    readonly kind: "not-idle";
} | {
    readonly kind: "unsupported";
} | {
    readonly kind: "started";
    readonly runId: string;
};
/**
 * Starts a successor owner bound to the original session stream, unless this
 * deployment's code finds work in the checkpoint that cannot move yet, or the
 * World cannot move session addresses between runs without releasing them.
 */
export declare function startSuccessorStep(input: SuccessorStartInput): Promise<SuccessorStart>;
/** Whether `runId` has ended; a run not readable yet has not. */
export declare function hasRunEndedStep(input: {
    readonly runId: string;
}): Promise<boolean>;
export type SessionCheckpointValidation = {
    readonly kind: "valid";
} | {
    readonly kind: "incompatible";
    readonly reason: "checkpoint-version";
}
/** The source no longer holds every address it handed over, so none may be taken. */
 | {
    readonly kind: "source-gone";
};
/**
 * Validates an upgraded checkpoint, resolves the target deployment's compiled
 * bundle, and records this owner's identity before it claims any hook.
 *
 * A checkpoint this deployment cannot read is a settled answer, not a fault,
 * so it returns rather than throws: retrying the step can never change it.
 */
export declare function prepareSuccessorStep(input: {
    /** Absent for version 1 sources, which predate the field. */
    readonly handoffVersion: number | undefined;
    readonly migration: Exclude<SessionCheckpointMigration, {
        readonly kind: "busy";
    }>;
    readonly sessionId: string;
    /** Version 3: the run that still holds the session and the addresses it hands over. */
    readonly source?: {
        readonly runId: string;
        readonly hookTokens: readonly string[];
    };
}): Promise<SessionCheckpointValidation>;
/** Records why the owner kept a session it tried to move, so a stuck handoff is visible. */
export declare function reportSessionHandoffRetainedStep(input: {
    readonly error?: string;
    readonly reason: "activation-failed" | "checkpoint-incompatible";
    readonly sessionId: string;
    readonly sourceDeploymentId: string;
    readonly targetDeploymentId: string;
}): Promise<void>;
/**
 * Records the identity of a legacy importer before it claims any hook;
 * handoff successors do the same inside `prepareSuccessorStep`. Ingress reads
 * `$eve.version` to decide whether the owner can run, so a missing value would
 * strand a healthy session. The value comes from this step's code, not the
 * previous owner's. Unlike observability attributes, a failed write fails the
 * boot.
 */
export declare function recordSessionOwnerStep(input: {
    readonly sessionId: string;
}): Promise<void>;
export declare function signalSessionOwnerActivationStep(input: {
    readonly activation: SessionOwnerActivation;
    readonly token: string;
}): Promise<void>;
/** Makes a takeover with no attempt open visible: every forced claim belongs to one. */
export declare function reportSessionTakenOverOutsideAttemptStep(input: {
    readonly sessionId: string;
}): Promise<void>;
/**
 * Makes a move whose handover part keeps failing visible; the owner keeps
 * retrying, because dropping the part would lose an accepted message.
 */
export declare function reportHandoverPartStuckStep(input: {
    readonly attemptKey: string;
    readonly error: string | undefined;
    readonly failures: number;
    readonly index: number;
    readonly sessionId: string;
}): Promise<void>;
/**
 * Sends one handover part through the stable session address, which reaches
 * whichever run owns the session. A part that keeps failing fails the step,
 * for the caller to retry until it is delivered.
 */
export declare function sendSessionHandoverPartStep(input: {
    readonly bufferedPayloadCount: number;
    readonly part: Omit<SessionHandoverPayload, "kind">;
    readonly sessionId: string;
}): Promise<"delivered" | "session-ended">;
export declare function signalSessionAnchorStep(input: {
    readonly result: {
        readonly output: unknown;
    };
    readonly token: string;
}): Promise<void>;
/** The position of the session stream's last line, or `-1` before the first. */
export declare function readSessionStreamTailStep(input: {
    readonly sessionId: string;
}): Promise<number>;
