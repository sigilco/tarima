import type { SessionStateMap } from "#harness/types.js";
export interface RunningWork {
    /** Workflow runs a turn waits on, as `workflow-tool-runs.ts` encodes them. */
    readonly calls: readonly unknown[];
    /** Tasks, as `execution/tasks/table.ts` encodes them. */
    readonly tasks: readonly unknown[];
}
export declare function readRunningWork(state: SessionStateMap | undefined): RunningWork;
/** Replaces one part of the record; the record leaves the state once nothing runs. */
export declare function writeRunningWork(state: SessionStateMap | undefined, part: Partial<RunningWork>): SessionStateMap | undefined;
