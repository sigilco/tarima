import type { ApprovalContext, ApprovalPolicy, ApprovalStatus } from "#approval/definition.js";
import { type ApprovalDecision } from "#approval/status.js";
import type { JsonValue } from "#shared/json.js";
/** A person's decision on a request that asked to be remembered, kept under the request's key. */
export interface RememberedApproval {
    readonly outcome: "accepted" | "declined";
    /** The interaction whose settlement recorded the decision. */
    readonly interactionId: string;
    readonly state?: JsonValue;
}
/** Where a request's settlement is remembered, with the state the policy attached. */
export interface RememberRequest {
    readonly key: string;
    readonly state?: JsonValue;
}
/** What policies can read: remembered decisions, and the keys open requests will record under. */
export interface ApprovalMemory {
    readonly remembered: Readonly<Record<string, RememberedApproval>>;
    readonly pending: readonly string[];
}
/**
 * The harness's evaluation of one call's approval policy, private to eve's own policies. Keys are
 * scoped to the tool the harness resolved: a policy can't read or record another tool's decisions,
 * whatever key it names or however it renames its context.
 */
export interface ApprovalEvaluation {
    readonly recheck: boolean;
    readonly read: (key: string) => {
        readonly entry?: RememberedApproval;
        readonly pending: boolean;
    };
    /** Asks a person; their decision is remembered under `remember.key` when it settles. */
    readonly ask: (remember: RememberRequest) => ApprovalStatus;
}
export declare function approvalEvaluation(context: ApprovalContext): ApprovalEvaluation | undefined;
/** Runs `policy` for one call. A person who already approved the call isn't asked again. */
export declare function evaluateApproval(policy: ApprovalPolicy, context: ApprovalContext, input?: {
    readonly memory?: ApprovalMemory;
    readonly recheck?: boolean;
}): Promise<ApprovalDecision>;
/** Remembers a person's decision under the key its request named, replacing an earlier one. */
export declare function rememberDecision(remembered: Readonly<Record<string, RememberedApproval>>, request: {
    readonly interactionId: string;
    readonly remember?: RememberRequest;
}, outcome: RememberedApproval["outcome"]): Readonly<Record<string, RememberedApproval>>;
export declare function inheritApprovalContext<T extends ApprovalContext>(source: ApprovalContext, context: T): T;
/** Whether `context` is the re-check of an approved call just before it runs. */
export declare function isApprovalRecheck(context: ApprovalContext): boolean;
