import type { SessionCommand } from "#channel/types.js";
/** Hands a losing session candidate's command to the session that owns the continuation. */
export declare function settleContinuationConflictStep(input: {
    readonly command: Extract<SessionCommand, {
        readonly kind: "send";
    }>;
    readonly continuationToken: string;
}): Promise<void>;
