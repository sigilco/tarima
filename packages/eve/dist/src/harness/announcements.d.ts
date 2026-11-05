import type { ModelMessage } from "ai";
import type { HistoryState } from "#context/keys.js";
import type { UserMessageKind } from "#harness/messages.js";
/**
 * Something a definition tells the model once, and again each time it changes: it joins the
 * history as one message ahead of the turn's input, so the cached prompt before it never changes.
 * eve records each key's last announced value with the history, and the message that said it. A
 * rewrite of the history, such as a compaction, announces again each key whose message it dropped.
 */
export interface Announcement {
    /** Canonical state. Only a value other than the last one announced adds a message. */
    readonly value: string;
    /**
     * The message for `value`; `previous` is the value last announced, `undefined` the first time.
     * `undefined` adds no message, and the key still records `value`.
     */
    render(previous: string | undefined): string | undefined;
    /** What the model knows without an announcement: a key never announced stays quiet at it. */
    readonly initial?: string;
    /** The message's kind. `"context.state"` where omitted. */
    readonly kind?: Extract<UserMessageKind, "context.instruction" | "context.state">;
}
/** Names an announcement's message by its kind and content, which a rewrite keeps verbatim. */
export declare function announcementDigest(kind: unknown, content: unknown): string;
/** What the history state still says once the history is `history`: the keys whose message it kept. */
export declare function keptAnnouncements(state: HistoryState, history: readonly ModelMessage[]): HistoryState;
