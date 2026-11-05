import { runStarted, type RunSettlement } from "#harness/facts.js";
import type { Commit } from "#harness/types.js";
import type { SessionEvent } from "#protocol/session-event.js";
import type { ErrorInfo, Usage } from "#protocol/session-events/envelope.js";
import type { FactOf } from "#protocol/session-events/facts.js";
import type { ModelOwner } from "#protocol/session-events/families/model.js";
import { type Transition } from "./commit.js";
import type { SessionView } from "./view.js";
/** A model run is asked for: a turn's, or a context change's summary run. */
export declare function requestRun(owner: ModelOwner, runId: string): Commit;
/** The run's model was chosen and an attempt at its provider call begins. */
export declare function startRun(input: Parameters<typeof runStarted>[0]): Commit;
/** An attempt failed and the run tries again. */
export declare function retryRun(input: {
    readonly attempt: number;
    readonly error: ErrorInfo;
    readonly runId: string;
}): Commit;
/** A run settles, with the result part it completed with, if any, and then what it spent. */
export declare function settleRun(settlement: RunSettlement, result?: FactOf<"content.completed">["data"]): Commit;
/** What a model call made outside eve's own model steps spent: inside a tool, against its call. */
export declare function recordUsage(input: {
    readonly kind: "auxiliary" | "decision";
    readonly callId?: string;
    readonly usage: Usage;
}): Commit;
/** Delegated spend that arrived after its calls settled, which no open entity owns. */
export declare function recordLateSpend(spends: readonly Usage[]): Commit;
/**
 * Delegated spend, owned by the call this commit settles. One reply may settle several calls
 * with the same result; its spend belongs once to the latest served call (the message's
 * source), never once per recipient. A serve body can keep spending after it replied or while
 * cancellation unwinds: no open call owns that, and an immutable settlement can't be amended,
 * so it is the task's own `delegated-late` usage.
 */
export declare function taskSpend(view: SessionView, input: {
    readonly settling: readonly SessionEvent[];
    readonly sourceCallId: string | undefined;
    readonly spend: Usage;
    readonly taskId: string;
}): Transition;
/** Spend a task run reported once nothing it served was open: the task's own late spend. */
export declare function lateTaskSpend(view: SessionView, spend: Usage | undefined): Transition;
