import type { DiscordGatewayDispatch } from "#public/channels/discord/gateway/connection.js";
export interface Forwarder {
    enqueue(dispatch: DiscordGatewayDispatch): void;
    /** Resolves once the backlog is delivered or `timeoutMs` elapses. */
    drain(timeoutMs: number): Promise<void>;
}
/**
 * Delivers dispatches to eve one at a time, in Gateway order. A bounded
 * backlog keeps a long eve outage from growing the relay's memory without limit.
 */
export declare function createForwarder(options: {
    readonly url: URL;
    readonly headers: () => Promise<Readonly<Record<string, string>>>;
}): Forwarder;
