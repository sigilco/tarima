import type { SlackEventContext } from "#public/channels/slack/slackChannel.js";
/** The status eve's default renderer last set in the thread. */
export interface SlackThreadStatus {
    readonly atMs: number;
    readonly text: string;
}
/**
 * Sets the thread status, unless the same text is already showing or the turn
 * is quiet because an edit or a deferred message started it. `force` writes it anyway, for moments
 * Slack may have cleared it, and so a long turn keeps it from timing out.
 */
export declare function showStatus(channel: SlackEventContext, text: string, options?: {
    readonly force?: boolean;
}): Promise<void>;
/** Shows the last status again, if any. */
export declare function restoreStatus(channel: SlackEventContext): Promise<void>;
/**
 * Clears the thread status but keeps its text, so the turn shows it again when
 * it resumes. It is no longer showing, so the next write always goes out.
 */
export declare function hideStatus(channel: SlackEventContext): Promise<void>;
/** Clears the thread status and forgets it: the turn has nothing more to show. */
export declare function clearStatus(channel: SlackEventContext): Promise<void>;
/**
 * The newest readable piece of a reasoning block so far: its latest heading
 * when the model titles its reasoning, as reasoning summaries do, otherwise
 * its latest finished sentence. A sentence still streaming counts once it
 * fills the status, so the status never shows half a short sentence. A
 * `complete` block has nothing streaming: its last sentence is finished.
 */
export declare function reasoningStatus(reasoning: string, options?: {
    readonly complete?: boolean;
}): string | undefined;
