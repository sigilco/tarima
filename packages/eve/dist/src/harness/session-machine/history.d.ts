import type { ModelMessage } from "ai";
import type { HarnessSession } from "#harness/types.js";
/**
 * How a step changes the conversation history. History only gains messages, except where a
 * repair or a rewrite says otherwise.
 */
export type HistoryChange = 
/** Messages join the end. */
{
    readonly append: readonly ModelMessage[];
}
/**
 * History becomes `messages`, which keep every message it held, in order: the step's prompt and
 * response, with the announcements its request placed ahead of the turn's input.
 */
 | {
    readonly extend: readonly ModelMessage[];
}
/** Tool exchanges a crash left unanswered gain their results; everything else stays. */
 | {
    readonly repaired: readonly ModelMessage[];
}
/**
 * History is replaced, as a compaction or a clear replaces it. What eve measured about the old
 * history no longer applies, nor do the announcements whose message it dropped.
 */
 | {
    readonly rewrite: readonly ModelMessage[];
};
type WithHistory = Pick<HarnessSession, "compaction" | "history">;
/** The one way a session's history changes. Every message is checked as it joins. */
export declare function changeHistory<T extends WithHistory>(session: T, change: HistoryChange): T;
export {};
