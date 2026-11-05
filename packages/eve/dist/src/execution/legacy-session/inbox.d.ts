import type { DeliverHookPayload, SessionCommand, SessionTimeoutHookPayload } from "#channel/types.js";
import { getHookByToken } from "#internal/workflow/runtime.js";
type Command = DeliverHookPayload | SessionCommand | SessionTimeoutHookPayload;
type Hook = Awaited<ReturnType<typeof getHookByToken>>;
/** Reported as an inactive session so the channel starts a fresh one. */
export declare class UnsupportedLegacySessionError extends Error {
    constructor();
}
/**
 * Finds the pre-cutover hook for a logical token. Once that session has been
 * imported, its current-generation inbox owns delivery and `current` is true.
 */
export declare function resolveLegacyInbox(token: string): Promise<{
    hook: Hook;
    sessionId: string;
    current: boolean;
}>;
export declare function resumeLegacyInbox(token: string, command: Command): Promise<{
    ownerRunId: string;
    sessionId: Promise<string>;
}>;
/** Frozen producer projection for driver wire versions 1–7; old consumers validate for themselves. */
export declare function encodeLegacyCommand(command: Command, declaredVersion: unknown): unknown;
export {};
