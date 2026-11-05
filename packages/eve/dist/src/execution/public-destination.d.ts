import type { Dispatcher1Wrapper } from "undici";
/** Rejection for a destination that the {@link PublicDestinationPolicy} blocks. */
export declare class UnsafeDestinationError extends Error {
    constructor(message?: string);
}
/** Destination policy for a framework request to an untrusted URL. */
export interface PublicDestinationPolicy {
    /** Permits loopback destinations, such as callbacks between local development servers. */
    readonly allowLoopback: boolean;
}
type DispatcherRequestInit = Omit<RequestInit, "dispatcher"> & {
    readonly dispatcher: Dispatcher1Wrapper;
};
/**
 * Rejects IP-literal and `localhost` hostnames the policy blocks. Socket
 * lookups never run for IP literals, so this check must precede the request.
 */
export declare function assertPublicHostname(hostname: string, policy: PublicDestinationPolicy): void;
/**
 * Creates a dispatcher whose socket lookup rejects a hostname when any
 * resolved address is blocked, then connects using those exact results so DNS
 * cannot change between validation and connection.
 */
export declare function createPublicDispatcher(policy: PublicDestinationPolicy): Promise<Dispatcher1Wrapper>;
/** Finds the policy rejection in an error, including one fetch wrapped from the socket lookup. */
export declare function findUnsafeDestinationError(error: unknown): UnsafeDestinationError | undefined;
export declare function fetchWithDispatcher(url: string | URL, init: DispatcherRequestInit): Promise<Response>;
/**
 * Buffers a response from an untrusted host, rejecting a declared or streamed
 * body over `maxResponseSize` bytes, so its connection can close.
 */
export declare function readBoundedResponse(response: Response, maxResponseSize: number): Promise<Response>;
export declare function cancelResponseBody(response: Response): Promise<void>;
export declare class ResponseTooLargeError extends Error {
    constructor(maxResponseSize: number);
}
export {};
