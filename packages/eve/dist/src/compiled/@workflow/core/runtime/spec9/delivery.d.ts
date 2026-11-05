import { type DeliveryResult, type Orchestrator, type WorkflowDelivery } from '../delivery.js';
/**
 * Runs one delivery of a spec 9 run's queue message.
 *
 * A delivery that must end before the run's work does (its deadline, a
 * stream flush, the replay budget, a wait or write it cannot read yet)
 * continues the run in a fresh delivery by handing its message off
 * (`{ timeoutSeconds: 0 }`, see `Queue.createQueueHandler`): every World
 * delivers the same message again at once and does not count the handed-off
 * delivery toward `attempt`. A new message would not do on world-vercel: a
 * message the orchestrator sent itself while it holds the run would be
 * coalesced into its own delivery and run again in this same invocation.
 */
export declare function runSpec9Delivery(delivery: WorkflowDelivery): Promise<DeliveryResult>;
/** The spec 9 orchestrator, for the shared entrypoint. */
export declare const spec9Orchestrator: Orchestrator;
//# sourceMappingURL=delivery.d.ts.map