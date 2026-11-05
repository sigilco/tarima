import type { Event, WorkflowRun } from '#compiled/@workflow/world/index.js';
import type { PayloadKey } from './serialization/encryption.js';
import { type PreparedReplayPayload, type ReplayPayloadPreparer } from './serialization.js';
type ReplayPayloadField = 'result' | 'error' | 'payload';
/**
 * The cache identity of an event's payload: its position and its entity. A
 * position alone is not an identity within one delivery: a run-ahead write is
 * prepared at the position it predicts, and when another writer appends first
 * it commits further up, while the predicted position holds another entity's
 * event.
 */
export declare function replayPayloadEventKey(event: {
    eventId: string;
    correlationId?: string;
}): string;
/**
 * Invocation-scoped cache for replay payload hydration.
 *
 * A workflow invocation may replay the same event log through several fresh
 * VMs. This cache keeps the VM-independent decrypt/decompress result across
 * those replays. Deserialization still runs against each VM's globals so every
 * replay receives fresh object graphs and correctly revived Workflow objects.
 *
 * Successful prepared plaintext and memoized primitive step results remain
 * resident for the invocation lifetime. Their memory never crosses workflow
 * runs or queue deliveries.
 */
export declare class ReplayPayloadCache {
    private readonly preparer;
    private readonly preparedPayloads;
    private readonly primitiveStepResults;
    private readonly encryptionKey;
    private nextUnscannedEventIndex;
    constructor(encryptionKey: PayloadKey | undefined | Promise<PayloadKey | undefined>, preparer?: ReplayPayloadPreparer);
    /** Start preparing an event payload as soon as its frame is decoded. */
    prepareEvent(event: Event): void;
    /**
     * Start every missing binary preparation before workflow execution. Failures
     * are intentionally retained: the ordered event consumer must observe the
     * original rejection before that entry becomes retryable.
     */
    prewarm(workflowRun: WorkflowRun, events: Event[]): Promise<void>;
    /** Rescan the next event log after an authoritative replacement. */
    resetScan(): void;
    /** Return the workflow input after shared host-side preparation. */
    prepareWorkflowInput(workflowRun: WorkflowRun): Promise<PreparedReplayPayload>;
    /**
     * Return an event payload after shared host-side preparation. A rejected
     * preparation is evicted only after this ordered consumer requests it, so a
     * later replay can retry without hiding the original failure.
     */
    prepareEventPayload(eventKey: string, field: ReplayPayloadField, value: unknown): Promise<PreparedReplayPayload>;
    /**
     * Reuse final step values only when sharing them across VMs is unobservable.
     * Objects always run `hydrate` again to produce a fresh VM-specific value;
     * every primitive is safe to reuse directly.
     */
    getStepResult(eventKey: string, hydrate: () => Promise<unknown>): Promise<unknown>;
    /**
     * Consumer-facing lookup. Binary payloads share preparation; legacy values
     * bypass the cache because their flattened representation may be mutated.
     */
    private consumePreparation;
    /** Start preparation once and share the exact in-flight promise. */
    private ensurePreparation;
    /** Normalize synchronous and asynchronous preparers to one promise contract. */
    private runPreparation;
    /** Start one event's binary payload unless another path already did. */
    private prepareEventIfMissing;
    private startPreparation;
    private workflowInputKey;
    private eventPayloadKey;
}
export {};
//# sourceMappingURL=replay-payload-cache.d.ts.map