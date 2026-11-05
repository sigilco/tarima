import type { DurableSessionState } from "#execution/durable-session-store.js";
/**
 * Every hook a session answers to, derived from its committed state: the
 * stable command inbox plus each continuation alias a channel handler
 * selected. This is the one source of truth for claims at boot, at every
 * state transition, and across a deployment handoff.
 */
export declare function sessionHookTokens(input: {
    readonly serializedContext: Record<string, unknown>;
    readonly sessionState: Pick<DurableSessionState, "continuationToken" | "sessionId">;
}): readonly string[];
