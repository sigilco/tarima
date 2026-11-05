import type { RuntimeActionRequestProjection } from "#harness/action-presentation.js";
import type { HarnessEmitFn } from "#harness/types.js";
interface ActionEventCoordinates {
    readonly runId?: string;
    readonly turnId: string;
}
interface ProviderStreamActionBatch {
    cancel(): Promise<void>;
    flush(): Promise<void>;
    observe(action: RuntimeActionRequestProjection): void;
}
/** Batches provider-managed calls that arrive in one streamed model response. */
export declare function createProviderStreamActionBatch(input: {
    readonly emitFn: HarnessEmitFn;
    readonly state: ActionEventCoordinates;
}): ProviderStreamActionBatch;
export {};
