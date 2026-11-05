/**
 * The execution message of a background step, as both spec 9 engines (the
 * node orchestrator in `delivery.ts` and the QuickJS one in
 * `quickjs-entrypoint.ts`) build and send it: one place for its wire fields,
 * key, retention and batching. Which steps get a message, and when, stays with
 * each engine.
 */
import { type HookResumeTiming, type WorkflowRun, type World } from '#compiled/@workflow/world/index.js';
import { type StepMessageSpec } from './log-state.js';
type QueuedMessage = {
    message: Parameters<World['queue']>[1];
    opts: NonNullable<Parameters<World['queue']>[2]>;
};
/**
 * The message and queue options of one step's execution message.
 *
 * The input rides on the message when the run's transport is binary and it
 * fits `MAX_STEP_MESSAGE_INPUT_BYTES`; otherwise the step's invocation reads
 * it back from `stepCreatedEventId`. The key is step-identity-scoped
 * (correlation id and hashed step name, see `stepDispatchIdempotencyKey`), so
 * a re-send of the same step is absorbed and a stale message for a reassigned
 * correlation id is not. The retention covers the step's retries.
 */
export declare function stepDispatchMessage(params: {
    run: WorkflowRun;
    step: StepMessageSpec;
    traceCarrier: Record<string, string>;
    delaySeconds?: number;
    /** Carried by the first message a hook resume dispatched. */
    hookResumeTiming?: HookResumeTiming;
}): QueuedMessage;
/**
 * Sends the messages of `items` (built by `toMessage`, see
 * `stepDispatchMessage`) in parallel queue batches of at most
 * `STEP_DISPATCH_QUEUE_BATCH_SIZE`. Rejects, with the first failed batch's
 * error, once every batch settled; `onBatchSent` is called with the items of
 * each batch that went out, so a caller can account for the sent ones of a
 * failed send.
 */
export declare function sendStepDispatchMessages<T>(world: World, queueName: Parameters<World['queue']>[0], items: readonly T[], toMessage: (item: T, index: number) => QueuedMessage, onBatchSent?: (batch: readonly T[]) => void): Promise<void>;
export {};
//# sourceMappingURL=step-message.d.ts.map