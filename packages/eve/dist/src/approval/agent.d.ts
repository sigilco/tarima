import { type Approval, type ApprovalPolicy } from "#approval/definition.js";
/**
 * Runs `policies` in order and returns the most restrictive status, unchanged, so a `once()`
 * status keeps the identity its memory depends on. A denial stops the rest; on a tie the later
 * policy wins, so the entry's own `once()` outranks an agent-wide ask.
 */
export declare function strictestApproval(policies: readonly ApprovalPolicy[]): ApprovalPolicy;
/**
 * The approval an entry runs under with the agent's policy: whichever of the two is stricter. The
 * agent's policy can only add a gate, never remove the entry's own. Without an agent policy the
 * entry keeps its own approval object, so agents that don't author one behave exactly as before.
 */
export declare function withAgentApproval(agent: ApprovalPolicy | undefined, own: Approval | undefined): Approval | undefined;
/**
 * Puts every entry in `entries` under the agent's policy. Task controls (`frameworkAction`) only
 * read or stop work the agent already started, and built-in interaction executors
 * (`interactionOnly`) act on nothing outside the conversation, so both stay ungated: gating them
 * would ask a person to approve being asked. Without a policy the entries are unchanged.
 */
export declare function withAgentApprovalOnEntries<T extends {
    readonly approval?: Approval;
    readonly frameworkAction?: unknown;
    readonly interactionOnly?: boolean;
}>(entries: ReadonlyMap<string, T>, agent: ApprovalPolicy | undefined): Map<string, T>;
