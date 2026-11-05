import type { ErrorInfo } from "#protocol/session-events/envelope.js";
import type { ContentCompletedData } from "#protocol/session-events/families/content.js";
/** The text a completed content part replies with, or `undefined` for anything else. */
export declare function replyTextOf(part: ContentCompletedData): string | undefined;
/** A failure as the error hint formatter reads it. */
export declare function errorHintOf(error: ErrorInfo | undefined): {
    readonly message?: string;
    readonly details?: {
        readonly name: string;
    };
};
/**
 * What a channel posts when a turn or the session fails, or `undefined` when it didn't: the
 * error's hint and id, and what the person can do next: try again, or, after a session that
 * can't recover, start a new conversation (`restart` names it: "message", "comment").
 */
export declare function failureNotice(ending: {
    readonly outcome: string;
    readonly error?: ErrorInfo;
}, scope: "turn" | {
    readonly restart: string;
}): string | undefined;
