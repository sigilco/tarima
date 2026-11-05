import type { ApprovalStatus } from "#approval/definition.js";
import type { ClearedBy } from "#protocol/session-events/families/call.js";
import type { RememberRequest } from "#approval/evaluation.js";
export type NormalizedApprovalStatus = Exclude<ApprovalStatus, boolean>;
/** Normalize legacy predicates and reject malformed JavaScript policy returns before execution. */
export declare function normalizeApprovalStatus(value: unknown): NormalizedApprovalStatus;
export interface ApprovalDecision {
    readonly remember?: RememberRequest;
    readonly clearedBy?: ClearedBy;
    readonly denied: boolean;
    readonly awaitsPerson?: true;
    readonly reason?: string;
}
export declare function approvalDecision(value: unknown): ApprovalDecision;
