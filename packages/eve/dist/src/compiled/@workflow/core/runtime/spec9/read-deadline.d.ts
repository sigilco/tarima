/** Default of {@link getOrchestratorReadTimeoutMs}, in milliseconds. */
export declare const DEFAULT_ORCHESTRATOR_READ_TIMEOUT_MS = 5000;
/**
 * How many times {@link readWithDeadline} sends a read whose attempts all run
 * out of time before it gives up.
 */
export declare const ORCHESTRATOR_READ_ATTEMPTS = 3;
/**
 * How long the first attempt at an orchestrator's incremental log read may
 * take before it is abandoned and sent again
 * (`WORKFLOW_ORCHESTRATOR_READ_TIMEOUT_MS`, default
 * {@link DEFAULT_ORCHESTRATOR_READ_TIMEOUT_MS}); each later attempt gets
 * twice as long as the one before. Such a read returns only what was
 * appended since the last one, so it is small, and a World answers it in
 * tens of milliseconds. One that has not answered after this long is
 * usually held somewhere between the World and the process, and a fresh
 * request for the same position is answered in the usual time; the longer
 * later attempts let a read that is slow because it carries large payloads
 * still finish. `0` disables the deadline.
 */
export declare function getOrchestratorReadTimeoutMs(env?: Record<string, string | undefined>): number;
/**
 * Runs a log read under a deadline, sending it again, up to `attempts` times
 * in all, when an attempt runs out of time. The first attempt gets
 * `timeoutMs`, and each later one twice the time of the one before.
 *
 * `read` must be safe to repeat: the orchestrator's reads are, since each
 * attempt asks for the same position and nothing is folded into the log
 * until one returns. An abandoned attempt's signal is aborted, so a World
 * that honors it cancels the request; its outcome, whenever it settles, is
 * dropped. When every attempt runs out of time the read fails with a
 * retryable `TIMEOUT` World error, so the delivery is redelivered rather than
 * held.
 *
 * A read that fails on its own (not by the deadline) fails at once, as it
 * would without the deadline. `timeoutMs <= 0` runs `read` once, with no
 * deadline and no signal.
 */
export declare function readWithDeadline<T>(read: (signal: AbortSignal | undefined) => Promise<T>, options: {
    timeoutMs: number;
    attempts?: number;
    /** What is being read, for the log line and the error. */
    label: string;
    runId: string;
}): Promise<T>;
//# sourceMappingURL=read-deadline.d.ts.map