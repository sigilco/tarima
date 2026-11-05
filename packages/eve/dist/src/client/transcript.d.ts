import type { SessionStreamEvent } from "#protocol/session-event.js";
/** One user message or completed assistant message in a {@link TranscriptData}. */
export interface TranscriptMessage {
    readonly role: "assistant" | "user";
    readonly text: string;
}
/** A session's text conversation, as {@link transcriptOf} reads it. */
export interface TranscriptData {
    /** The messages of the session's current conversation, oldest first. */
    readonly messages: readonly TranscriptMessage[];
}
/** Options for {@link transcriptOf}. */
export interface TranscriptOptions {
    /**
     * Most recent messages kept; older ones are dropped as new ones arrive.
     * A positive integer. Unbounded when omitted.
     */
    readonly maxMessages?: number;
}
/**
 * A session's text conversation, from its stream: imported history, user message text, and
 * completed assistant text, oldest first.
 *
 * The user's text is what each consumed delivery carries, after the history it imported; the
 * assistant's is each completed reply part. When one line consumes several deliveries, their
 * history comes before their messages, as the model reads them. Reasoning, narration, tool calls
 * and results, attachments, interactions, and interrupted or unfinished output are left out.
 *
 * Only the session's current conversation is returned: the newest turn, or the one a later
 * context change selected, and the turns it follows back. A completed clear (`context.settled`
 * selecting nothing), or a reset that ended a stranded session, starts the transcript over, so
 * text the session no longer holds is never returned.
 *
 * @example
 * ```ts
 * import { transcriptOf } from "eve/client";
 * import { sessions } from "eve/server";
 *
 * const events = [];
 * for await (const event of sessions.attach(sessionId).stream({ follow: false })) events.push(event);
 * const { messages } = transcriptOf(events, { maxMessages: 40 });
 * ```
 *
 * @throws When `maxMessages` is not a positive integer.
 */
export declare function transcriptOf(events: Iterable<SessionStreamEvent>, options?: TranscriptOptions): TranscriptData;
