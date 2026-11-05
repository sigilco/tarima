import { type DiscordFetch } from "#public/channels/discord/api.js";
/** Raised when Discord refuses the bot outright, so reconnecting cannot help. */
export declare class DiscordGatewayFatalError extends Error {
}
/** A Gateway dispatch (op 0) as Discord sends it. */
export interface DiscordGatewayDispatch {
    readonly op: 0;
    readonly t: string;
    readonly s: number;
    readonly d: unknown;
}
export interface GatewayConnectionOptions {
    readonly apiBaseUrl?: string;
    readonly fetch?: DiscordFetch;
    readonly intents: number;
    readonly resolveToken: () => Promise<string>;
    readonly onDispatch: (dispatch: DiscordGatewayDispatch) => void;
    readonly signal: AbortSignal;
}
/**
 * Holds one Discord Gateway session until `signal` aborts, resuming across
 * reconnects so dispatches are not lost while the process lives.
 */
export declare function runGatewayConnection(options: GatewayConnectionOptions): Promise<void>;
/** Resolves after `ms`, or as soon as `signal` aborts. */
export declare function sleep(ms: number, signal?: AbortSignal): Promise<void>;
