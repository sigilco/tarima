import type { LocalWorld } from "#compiled/@workflow/world-local/index.js";
export declare const LOCAL_WORKFLOW_DELIVERY_HEADER = "x-eve-workflow-delivery";
/**
 * Makes the local World's flow route accept only deliveries this process
 * enqueued. The route is as reachable as the server, and world-local trusts
 * whatever `x-vqs-*` headers and body arrive, so without a proof any client
 * could forge a delivery, including its run context and principal.
 *
 * The proof is a random per-process secret that never leaves the process:
 * the local World only delivers to the server that enqueued. world-local's
 * own startup recovery enqueues past the wrapped queue, so the World must be
 * created with `recoverActiveRuns: false`; `start()` recovers through the
 * stamped queue instead.
 *
 * Mutates and returns `world`.
 */
export declare function authenticateLocalWorkflowDeliveries(world: LocalWorld, secret?: string): LocalWorld;
