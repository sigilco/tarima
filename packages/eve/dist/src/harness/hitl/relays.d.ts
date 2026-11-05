import type { RelayRoute } from "#channel/types.js";
/**
 * Marks a request as a workflow tool run's `ctx.ask()` question, rather than a
 * child session's. Its answer goes to the run's control hook, which carries
 * every decision the session makes for the run, in order.
 */
export interface WorkflowAskRoute {
    readonly control: string;
}
/**
 * Where answers to one relayed request go. What the request asks, and how it stands, is its
 * interaction row; this is only the way back to the asker.
 */
export interface Relay extends RelayRoute {
    readonly workflowAsk?: WorkflowAskRoute;
    /**
     * The workflow tool run that relayed the request: its own `ctx.ask()`
     * question, or a request from a session it opened with `ctx.agent`. Nobody
     * can answer the request once that run ends.
     */
    readonly runId?: string;
}
/** Reads one stored route, or `undefined` when it is malformed. */
export declare function parseRelay(value: unknown): Relay | undefined;
