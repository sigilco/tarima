import type { Approval, ApprovalPolicy } from "#approval/definition.js";
/** Validates the function shorthand or explicit request/response/prompt approval shape. */
export declare function normalizeApproval(value: unknown, message: string): Approval;
/**
 * Validates `defineAgent`'s `approval`: a request policy only. Prompts and response policies stay
 * with the entries that ask, so the agent's policy adds a gate without changing who answers it.
 */
export declare function normalizeAgentApproval(value: unknown, message: string): ApprovalPolicy;
