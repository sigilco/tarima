import type { RuntimeToolResultActionResult } from "#shared/action-types.js";
import type { SessionStateMap } from "#harness/types.js";
/** One workflow tool call the originating turn waits on. */
export interface BlockingWorkflowToolRun {
    readonly callId: string;
    readonly toolName: string;
    readonly origin: {
        readonly turnId: string;
        readonly stepIndex: number;
    };
    readonly address: {
        readonly runId: string;
        readonly hookToken: string;
    };
}
export declare function getBlockingWorkflowToolRuns(state: SessionStateMap | undefined, turnId?: string): readonly BlockingWorkflowToolRun[];
/** Registration is idempotent by originating turn and call. */
export declare function registerWorkflowToolRun<T extends {
    readonly state?: SessionStateMap;
}>(session: T, entry: BlockingWorkflowToolRun): T;
/** Removes this turn's waiting calls, or only one of them when `callId` is given. */
export declare function removeBlockingWorkflowToolRuns<T extends {
    readonly state?: SessionStateMap;
}>(session: T, turnId: string, callId?: string): T;
/** Results without an originating turn may bind only when exactly one recorded turn owns the call. */
export declare function findBlockingWorkflowToolRun(state: SessionStateMap | undefined, callId: string, turnId?: string): BlockingWorkflowToolRun | undefined;
/** The turn inbox is shared; a result settles a call only if the turn recorded that run. */
export declare function isInboxToolResultFromRecordedWorkflowToolRun(state: SessionStateMap | undefined, result: RuntimeToolResultActionResult): boolean;
