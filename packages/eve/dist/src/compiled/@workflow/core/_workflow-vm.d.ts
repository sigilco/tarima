import { Script } from 'node:vm';
import type { Event, WorkflowRun, WorldCapabilities } from '#compiled/@workflow/world/index.js';
import { type ParkedSummary } from './events-consumer.js';
import { WorkflowSuspension } from './global.js';
import { ReplayPayloadCache } from './replay-payload-cache.js';
import type { RunStartHook } from './runtime/start-hook-binding.js';
import type { PayloadKey } from './serialization/encryption.js';
/**
 * Records the items a finished run's workflow left queued, as the
 * orchestrator records any suspension (see `drainPendingQueueItems`), except
 * that disposals the terminal event makes redundant are skipped. Each
 * orchestrator passes its own; without one nothing is drained.
 */
export type PendingQueueDrain = (suspension: WorkflowSuspension, workflowRun: WorkflowRun) => Promise<void>;
/** Everything needed to cold-start a workflow VM over an event log. */
interface WorkflowSessionOptions {
    readonly workflowCode: string;
    readonly workflowRun: WorkflowRun;
    readonly events: Event[];
    readonly encryptionKey: PayloadKey | undefined;
    readonly replayPayloadCache: ReplayPayloadCache;
    readonly compiledWorkflowScripts?: CompiledWorkflowScripts;
    /** Records the end-of-run drain. */
    readonly drainPendingQueue?: PendingQueueDrain;
    readonly worldCapabilities?: WorldCapabilities;
    /**
     * The run's start Hook, from `resolveRunStartHook`. `undefined` for a run
     * started without one, which then replays exactly as before.
     */
    readonly startHook?: RunStartHook;
}
/** Context-independent V8 scripts that can be evaluated in any fresh VM. */
export interface CompiledWorkflowScripts {
    readonly bundleScript: Script;
    readonly workflowLookupScript: Script;
}
export declare function compileWorkflowBundle(workflowCode: string, workflowName: string): Promise<CompiledWorkflowScripts>;
/** Compile invocation-scoped dynamic source without touching the static cache. */
export declare function compileDynamicWorkflowBundle(workflowCode: string, workflowName: string): Promise<CompiledWorkflowScripts>;
/**
 * A live workflow VM, parked at a suspension boundary. `resume` advances it
 * by appending events instead of replaying from scratch.
 */
export interface WorkflowSession {
    readonly workflowRun: WorkflowRun;
    readonly argumentCount: number;
    resume(events: Event[], rebase?: WorkflowSessionRebase): Promise<WorkflowResumeResult>;
}
/**
 * How a log differs from what a retained session consumed, when it does not
 * extend it: the session consumed some of its own events ahead of their
 * writes, at positions they did not get, and another writer's events landed
 * below them. Without a rebase, a log that is not a strict extension of what
 * the session consumed sends it to a cold replay.
 */
export interface WorkflowSessionRebase {
    /**
     * The id each event the session consumed ahead of its write committed
     * under, where the two differ.
     */
    readonly aliases: ReadonlyMap<string, string>;
    /**
     * Whether an event the session never consumed may still join it although
     * it sits below events it did. It is fed after them, so this holds only
     * for an event whose position before the next consumer cannot change what
     * the workflow decides (see `runtime/out-of-band-observation.ts`).
     */
    admitBelow(event: Event): boolean;
}
/** A finished execution attempt: the workflow's output or a live boundary. */
export type WorkflowResult = {
    readonly type: 'completed';
    readonly output: unknown;
    /** `typeof` the raw return value, for telemetry. */
    readonly resultType: string;
} | {
    readonly type: 'suspended';
    readonly suspension: WorkflowSuspension;
    readonly session: WorkflowSession;
    /**
     * Events the replay walked past unclaimed and is still holding, if any.
     * Ordinary on a suspension, and only actionable across a run's
     * suspensions, so it is reported for telemetry rather than acted on here.
     */
    readonly parked?: Readonly<ParkedSummary>;
};
/**
 * `resume` can additionally decline: `{ type: 'replay' }` means "this
 * session is unusable, cold-replay instead". A fresh replay never declines.
 */
export type WorkflowResumeResult = WorkflowResult | {
    readonly type: 'replay';
};
/** Cold-start: build a fresh VM session and replay it over `events`. */
export declare function replayWorkflow(options: WorkflowSessionOptions): Promise<WorkflowResult>;
/** Warm-start: advance a retained session by appending events. */
export declare function resumeWorkflow(session: WorkflowSession, events: Event[], rebase?: WorkflowSessionRebase): Promise<WorkflowResumeResult>;
/**
 * Single-shot replay: execute the workflow over `events` and either return
 * its output or throw its suspension. Kept for the extensive existing test
 * suites; production code goes through `replayWorkflow`/`resumeWorkflow`.
 */
export declare function runWorkflow(workflowCode: string, workflowRun: WorkflowRun, events: Event[], encryptionKey: PayloadKey | undefined, 
/**
 * Optional per-run cache for replay payload preparation and immutable final
 * values. Owned by the inline execution loop for this invocation.
 */
replayPayloadCache?: ReplayPayloadCache, 
/** Records the end-of-run drain. */
drainPendingQueue?: PendingQueueDrain, 
/**
 * Features supported by the World executing this workflow. Missing
 * capabilities are treated as unsupported.
 */
worldCapabilities?: WorldCapabilities, 
/** The run's start Hook, if it was started with one. */
startHook?: RunStartHook): Promise<Uint8Array | unknown>;
export {};
//# sourceMappingURL=workflow.d.ts.map