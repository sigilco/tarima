import type { PrewarmSessionResult } from "#protocol/prewarm-session.js";
/** Internal hint, scoped to the owner inspected by ingress to avoid stale transfers. */
export interface SessionPrewarmPayload {
    readonly kind: "session-prewarm";
    readonly expectedOwnerRunId: string;
    readonly targetDeploymentId: string;
}
export declare function prewarmWorkflowSession(sessionId: string, targetDeploymentId: string | undefined): Promise<PrewarmSessionResult>;
