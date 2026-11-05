import type { Storage } from './interfaces.js';
import { type Queue } from './queue.js';
/**
 * Re-enqueue all active (pending/running) workflow runs so they resume
 * processing after a world restart. The workflow handler is idempotent
 * (event-log replay), so duplicate enqueues are safe.
 *
 * Each message carries the run's spec version as `runSpecVersion`, which is
 * what a World reads to serialize a single-orchestrator run's deliveries.
 *
 * A run goes back to the queue namespace it recorded when it was created
 * (`executionContext.queueNamespace`, see `getRunQueueNamespace`), so a run
 * started under another namespace, or by a queue consumer other than the
 * Workflow SDK, reaches its own consumer rather than this process's. Runs that
 * recorded none use `namespace`.
 *
 * @param runs - Storage runs interface for listing active runs
 * @param enqueue - Queue's enqueue method
 * @param label - Log prefix for identifying the world implementation (e.g. "world-local")
 * With `queueLost`, each message also carries `recovery: true`: the World's
 * queue did not survive the restart (world-local's is in memory), so the
 * run's queued step messages and wait timers are gone, and a
 * single-orchestrator delivery of the message sends them again. A World
 * whose queue persists (world-postgres) leaves it unset: its queued messages
 * still arrive.
 *
 * @param runs - Storage runs interface for listing active runs
 * @param enqueue - Queue's enqueue method
 * @param label - Log prefix for identifying the world implementation (e.g. "world-local")
 * @param namespace - Optional queue namespace. Defaults to WORKFLOW_QUEUE_NAMESPACE.
 * @param options.queueLost - Whether the World's queue lost its messages.
 */
export declare function reenqueueActiveRuns(runs: Storage['runs'], enqueue: Queue['queue'], label: string, namespace?: string, options?: {
    queueLost?: boolean;
}): Promise<void>;
//# sourceMappingURL=recovery.d.ts.map