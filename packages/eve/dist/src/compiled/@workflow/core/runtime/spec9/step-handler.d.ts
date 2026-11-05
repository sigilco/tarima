import { type WorkflowInvokePayload, type WorkflowRun, type World } from '#compiled/@workflow/world/index.js';
import type { ResumeTtrTracking } from '../resume-latency.js';
type Span = {
    setAttributes(attributes: Record<string, unknown>): void;
};
export interface StepMessageContext {
    world: World;
    runId: string;
    workflowName: string;
    namespace: string | undefined;
    requestId: string | undefined;
    payload: Pick<WorkflowInvokePayload, 'stepId' | 'stepName' | 'stepAttempt' | 'stepResent' | 'stepInput' | 'stepCreatedEventId' | 'stepCreatedAt' | 'runContext'> & {
        stepId: string;
        stepName: string;
    };
    /** The run, when routing the delivery already read it. */
    prefetchedRun?: WorkflowRun;
    meta: {
        /**
         * Deliveries of the message that count as attempts (handoffs and
         * coalesced re-runs left out), as the World reports them.
         */
        attempt?: number;
        deliveryCount?: number;
        createdAt?: Date;
        messageId: string;
    };
    resumeTracking: ResumeTtrTracking | undefined;
    span: Span | undefined;
    nextTraceCarrier: () => Promise<Record<string, string>>;
    /**
     * The deployment-affinity guard of the orchestrator handler. Returns false
     * when the delivery was re-routed or refused and must end here.
     */
    guardDeployment: (run: {
        runId: string;
        deploymentId: string;
        specVersion: number;
    }) => Promise<boolean>;
}
/**
 * Handles one delivery of a background step's queue message.
 *
 * The step invocation never replays the workflow and never continues the
 * run. It:
 *
 * 1. decides from the delivery (and, on any delivery but a plain first one,
 *    from the run's full log) whether to run the body, using the table in
 *    `orchestrator/step-delivery.ts`;
 * 2. writes `step_started`, runs the body once it committed, and writes the
 *    outcome, all out-of-band (`inBand: false`). Under the opt-in
 *    `WORKFLOW_OPTIMISTIC_BACKGROUND_START`, a plain first delivery of a step
 *    that allows retries starts its body while `step_started` is in flight,
 *    and its outcome is written only once that start committed;
 * 3. wakes the run's orchestrator with an unkeyed message.
 *
 * Its result is queue control, per the World's `createQueueHandler`
 * contract: `undefined` acknowledges the message, `{ timeoutSeconds }`
 * delivers the same message again after the delay. The message is
 * acknowledged only once a terminal step event or a terminal run is
 * committed, so a retry stays on this message until the step ends.
 */
export declare function handleStepMessage(ctx: StepMessageContext): Promise<{
    timeoutSeconds: number;
} | undefined>;
/**
 * Wakes the run's orchestrator after an out-of-band write. No idempotency
 * key: a key could be absorbed by a delivery that is already exiting and lose
 * the wakeup, while a duplicate wake only costs a cheap delivery.
 *
 * A background step's outcome wakes it this way too, without reading the
 * run's log first: the orchestrator decides from its own load what the
 * outcome lets the run do. A fan-out's completions then send one wake each,
 * which a World that coalesces an orchestrator's messages folds into the
 * delivery that holds the run, and which a delivery that finds nothing new
 * since its last consumed position acknowledges without a replay (see
 * `consumed-position.ts`).
 *
 * `specVersion` is the run's: the wake carries it, so a World that reads the
 * run's spec off the payload (world-vercel keys and continues spec 9 runs'
 * messages differently) never has to guess.
 */
export declare function wakeOrchestrator(ctx: {
    world: World;
    runId: string;
    workflowName: string;
    namespace: string | undefined;
    nextTraceCarrier: () => Promise<Record<string, string>>;
    specVersion: number;
}): Promise<void>;
export {};
//# sourceMappingURL=step-handler.d.ts.map