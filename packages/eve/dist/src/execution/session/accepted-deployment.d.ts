import type { DeliverHookPayload } from "#channel/types.js";
/** Exact trusted deployment shared by every payload in a delivery. */
export declare function readAcceptedDeploymentId(delivery: DeliverHookPayload): string | undefined;
