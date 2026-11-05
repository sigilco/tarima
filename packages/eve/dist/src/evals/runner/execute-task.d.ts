import type { Client } from "#client/client.js";
import type { AssertionResult, EveEval, EveEvalDerivedFacts, EveEvalSessionResult, EveEvalTargetHandle, EveEvalTaskResult } from "#evals/types.js";
import type { EvalSessionStartedEvent } from "#evals/session.js";
/**
 * Options for executing one eval's task.
 */
interface ExecuteTaskOptions {
    readonly client: Client;
    readonly evaluation: EveEval;
    /** Receives each `t.log` line as it is written (used by `--verbose`). */
    readonly onLog?: (message: string) => void;
    /** Receives the first trace context observed for each session. */
    readonly onSessionStart?: (event: EvalSessionStartedEvent) => void;
    /** Shared setup context; stays in the runner process. */
    readonly setupContext?: unknown;
    readonly target: EveEvalTargetHandle;
    readonly timeoutMs?: number;
}
/**
 * Task result plus the assertions the eval's `test(t)` recorded. `error` is
 * set when the `test` body threw (e.g. a failed `expectOk()` or a bespoke
 * `throw`); the partial run is still captured so recorded assertions report.
 */
interface ExecuteTaskResult {
    readonly result: EveEvalTaskResult;
    readonly assertions: readonly AssertionResult[];
    readonly error?: string;
    readonly skipReason?: string;
}
/**
 * Executes one eval's `test(t)` against an eve agent target: drives the
 * session(s), captures the run, then finalizes the recorded assertions
 * against the completed task result.
 */
export declare function executeTask(options: ExecuteTaskOptions): Promise<ExecuteTaskResult>;
/** The facts of every session an eval read, each session's handles read as one stream. */
export declare function combineDerivedFacts(sessions: readonly EveEvalSessionResult[]): EveEvalDerivedFacts;
export {};
