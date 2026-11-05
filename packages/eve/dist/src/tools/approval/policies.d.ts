import type { DecisionModel } from "#ai/decision-types.js";
import type { ApprovalPolicy } from "#approval/definition.js";
import type { AgentModelOptionsDefinition } from "#shared/agent-definition.js";
export interface AutoApprovalOptions {
    /** Decision model instance or ID. Defaults to TypeSafe Jev. */
    readonly model?: DecisionModel;
    /** Provider options for the decision call. */
    readonly modelOptions?: Pick<AgentModelOptionsDefinition, "providerOptions">;
    /** Instructions used to classify the exact tool call. */
    readonly instructions?: string;
    /** Descriptions of the fixed approval outcomes. */
    readonly criteria?: {
        readonly clear?: string;
        readonly caution?: string;
    };
}
/**
 * Returns an `approval` callback that asks an AI SDK decision model whether
 * the exact tool call presents concrete security danger. Defaults to TypeSafe Jev.
 * Unavailable or invalid decisions require user approval.
 */
export declare function auto<TInput = unknown>(options?: AutoApprovalOptions): ApprovalPolicy<TInput>;
/** Returns an `approval` callback that always requires user approval. */
export declare function always<TInput = unknown>(): ApprovalPolicy<TInput>;
/** Returns an `approval` callback that never requires user approval. */
export declare function never<TInput = unknown>(): ApprovalPolicy<TInput>;
/** Remembers a person's approval for this tool for the rest of the session. */
export declare function once<TInput = unknown>(): ApprovalPolicy<TInput>;
