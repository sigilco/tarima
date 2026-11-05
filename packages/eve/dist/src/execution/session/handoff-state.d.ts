import type { DurableSessionState } from "#execution/durable-session-store.js";
/** Parses retained work with this deployment's code before deciding whether it can move. */
export declare function isSessionStateIdleForHandoff(input: {
    readonly sessionState: DurableSessionState;
}): boolean;
