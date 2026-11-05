import type { WorkflowToolRunControlMessage } from "#execution/tools/workflow/messages.js";
import type { WorkflowToolRunAddress } from "#execution/tools/workflow/types.js";
import type { SessionStateMap } from "#harness/types.js";
/** How a run is told to stop: `end` also finishes a `serve` task's run, which a cancel keeps. */
export type RunStop = Extract<WorkflowToolRunControlMessage, {
    readonly kind: "cancel" | "end";
}>;
/** One run to stop. */
export interface RunStopTarget {
    readonly run: WorkflowToolRunAddress;
    /**
     * Whether the stop ends the run. A resumable task's cancel stops only its current stretch of
     * work, and its run stays parked for later calls, so nothing waits for it to end.
     */
    readonly ends: boolean;
}
/**
 * The workflow tool runs the session's turn waits on; each run is one call, which a cancel ends.
 * A cancel still commits when they can't be read, so it stops none of them.
 */
export declare function waitedCallRuns(session: {
    readonly sessionId: string;
    readonly state?: SessionStateMap;
}): RunStopTarget[];
/**
 * Stops runs, the same way whoever stops them: each is told to stop, and a run that couldn't be
 * told, such as one that hasn't registered its control hook yet, is cancelled outright. By default
 * a run the stop ends gets until the deadline to finish cleaning up, and one still running then is
 * cancelled outright too. With `waitForEnd: false` nothing waits: a told run that never finishes
 * is not cancelled here, and keeps running until it ends on its own or its session ends.
 * Returns the runs cancelled outright, which never report how they ended.
 */
export declare function stopRuns(targets: readonly RunStopTarget[], stop: RunStop, options?: {
    readonly waitForEnd?: boolean;
}): Promise<readonly string[]>;
