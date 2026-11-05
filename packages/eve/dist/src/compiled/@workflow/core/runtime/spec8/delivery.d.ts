import { type DeliveryResult, type Orchestrator, type WorkflowDelivery } from '../delivery.js';
/** Runs one delivery of a spec 8 (or older) run's queue message. */
export declare function runSpec8Delivery(delivery: WorkflowDelivery): Promise<DeliveryResult>;
/** The spec 8 (and below) orchestrator, for the shared entrypoint. */
export declare const spec8Orchestrator: Orchestrator;
//# sourceMappingURL=delivery.d.ts.map