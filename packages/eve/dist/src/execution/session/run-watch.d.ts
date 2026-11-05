import type { SessionInboxHandle } from "#execution/session-inbox/inbox.js";
export interface RunWatch {
    /** Resolves once the run has ended; never settles once stopped. */
    readonly ended: Promise<void>;
    stop(): void;
}
/**
 * Watches a counterpart run so a wait on it has a way out when that run is
 * gone. Durable sleeps between checks keep it deterministic under replay;
 * `stop()` ends it before its next check.
 */
export declare function watchRunEnd(runId: string): RunWatch;
/**
 * Opens the inbox's handover gate with nothing restored if `sourceRunId` ends
 * before its handover arrives: an ended run can never send it. The watch
 * starts only once a read waits on the gate, so a handover that arrives
 * before it is needed costs nothing.
 */
export declare function abandonHandoverIfRunEnds(inbox: SessionInboxHandle, handover: {
    readonly attemptKey: string;
    readonly sourceRunId: string;
}): void;
