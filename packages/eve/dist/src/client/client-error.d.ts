import { EveError } from "#shared/eve-error.js";
import { SessionNotActiveError } from "#channel/session-not-active-error.js";
/**
 * Codes eve's HTTP routes return. Custom auth and proxies can return others, and `http_error`
 * means the response carried no code.
 */
export type ClientErrorCode = "unauthorized" | "forbidden" | "info_forbidden" | "eve_production_auth_not_configured" | "session_stranded" | "session_expired" | "descendant_unavailable" | "cycle" | "unsupported" | "session_version_unsupported" | "invalid_stream_response" | "http_error" | (string & {});
/**
 * Error thrown when the eve server returns a non-successful HTTP response.
 * Narrow with `ClientError.is(error)`.
 */
export declare class ClientError extends EveError {
    static readonly errorName: string;
    /** The response body's eve error code, or `http_error` when it has none. */
    readonly code: ClientErrorCode;
    /**
     * HTTP status code returned by the server.
     */
    readonly status: number;
    /**
     * Raw response body text.
     */
    readonly body: string;
    /**
     * Response headers, normalized to lowercase names.
     */
    readonly headers: Readonly<Record<string, string>>;
    constructor(status: number, body: string, headers?: ConstructorParameters<typeof Headers>[0]);
}
/**
 * Thrown by `ClientSession.send()`, `respond()`, `clear()`, and live stream connections when the server
 * answers `409 session_stranded`: another eve version built the session's owner, so it can never
 * execute on that deployment and new input is not delivered. Call `end()` on the session, then
 * create a new one. `stream({ follow: false })` still reads recorded history.
 */
export declare class ClientSessionStrandedError extends ClientError {
    static readonly errorName = "ClientSessionStrandedError";
    readonly code: "session_stranded";
    /** The eve version that built the session, when it recorded one. */
    readonly eveVersion: string | undefined;
    constructor(status: number, body: string, headers: ConstructorParameters<typeof Headers>[0] | undefined, details: {
        readonly eveVersion: string | undefined;
    });
}
/** Builds the most specific client error for a failed eve session request. */
export declare function createClientError(status: number, body: string, headers?: ConstructorParameters<typeof Headers>[0]): ClientError | SessionNotActiveError;
