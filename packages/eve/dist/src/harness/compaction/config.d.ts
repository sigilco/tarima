import { type Step } from "#harness/step/context.js";
import type { CompactionConfig, CompactionState } from "#harness/types.js";
/** How the step's call compacts: what the session observed, under a share of the model's window. */
export declare function compactionConfig(step: Pick<Step, "ctx" | "model"> & {
    readonly session: {
        readonly compaction: CompactionState;
    };
}): CompactionConfig;
