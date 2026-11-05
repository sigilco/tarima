import type { DeliverHookPayload, SessionCommand, SessionTimeoutHookPayload } from "#channel/types.js";
import type { SessionPrewarmPayload } from "#execution/session-prewarm.js";
type DecodedSessionInbox = SessionPrewarmPayload | DeliverHookPayload | SessionTimeoutHookPayload | Extract<SessionCommand, {
    readonly kind: "cancel" | "clear" | "compact" | "reset";
}>;
/** Invalid current-generation inbox payload. Historical wire shapes are not accepted. */
export declare class SessionInboxPayloadError extends Error {
    constructor(message: string);
}
/** Normalizes the one authored `send` convenience command into a delivery. */
export declare function decodeSessionInboxPayload(value: unknown): DecodedSessionInbox;
export {};
