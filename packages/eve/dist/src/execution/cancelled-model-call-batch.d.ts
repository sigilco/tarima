import { type ContextContainer } from "#context/container.js";
import type { DurableStepResult } from "#execution/session/turn-step-types.js";
import type { HarnessSession, HarnessStepInput, StepResult } from "#harness/types.js";
export interface CompletedModelCallCheckpoint {
    readonly result: StepResult;
    readonly serializedContext: Record<string, unknown>;
}
/** The session with the message of a step that stopped before the model read it kept in history. */
export declare function preserveStoppedTurnMessage(ctx: ContextContainer, session: HarnessSession, preserved: HarnessStepInput | undefined): Promise<HarnessSession>;
/** Builds the successful step result that commits a cancelled batch's completed model calls. */
export declare function createCancelledModelCallBatchResult(input: {
    readonly beforeBatchContext: Record<string, unknown>;
    readonly checkpoint: CompletedModelCallCheckpoint | undefined;
    readonly ctx: ContextContainer;
    readonly initialSession: HarnessSession;
    readonly stepInput: HarnessStepInput | undefined;
}): Promise<DurableStepResult>;
