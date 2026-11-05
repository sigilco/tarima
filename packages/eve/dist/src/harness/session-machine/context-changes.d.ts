import type { Commit } from "#harness/types.js";
import type { Usage } from "#protocol/session-events/envelope.js";
import type { FactOf } from "#protocol/session-events/facts.js";
import type { SessionView } from "#protocol/session-projection/tables.js";
/** A context change starts. */
export declare function startChange(data: FactOf<"context.started">["data"]): Commit;
/** A change's summary run is asked for and starts, in one commit. */
export declare function startSummaryRun(input: {
    readonly changeId: string;
    readonly runId: string;
    readonly modelId: string;
}): Commit;
/**
 * A compaction completes. Its summary run completes when a summary call returned, with what the
 * calls spent; a run that opened and returned nothing is abandoned.
 */
export declare function completeCompaction(input: {
    readonly changeId: string;
    readonly runId: string;
    readonly runOpen: boolean;
    readonly summarized: boolean;
    readonly usage: Usage | undefined;
}): Commit;
/** A change's summary run failed, and the change with it; the run records what it spent. */
export declare function failChange(view: SessionView, input: {
    readonly changeId: string;
    readonly error: unknown;
    readonly spent?: {
        readonly runId: string;
        readonly usage: Usage;
    };
}): Commit;
