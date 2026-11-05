import type { AgentObservation, ConversationState } from "#client/conversation-state.js";
import type { SessionStreamEvent } from "#protocol/session-event.js";
import type { SessionPreviews, SessionView } from "#protocol/session-projection/tables.js";
import type { Answer } from "#shared/input.js";
/** A message this client sent that eve hasn't consumed yet, or that failed to send. */
export interface LocalSubmission {
    readonly id: string;
    readonly message: string;
    /** The open turn a steering message joins, when known. */
    readonly turnId?: string;
    readonly error?: {
        readonly message: string;
    };
}
/**
 * One session as a client shows it: the shared tables its stream folds into, with the previews
 * of what is still streaming, and what this client did that the stream hasn't confirmed yet (the
 * messages it sent and the answers it gave). `state` derives the conversation from them.
 *
 * The tables fold in place, so a long session costs each event only what it changes, and `state`
 * rebuilds only the messages of the turns that changed since it was last read.
 */
export declare class Conversation {
    #private;
    readonly view: SessionView;
    readonly previews: SessionPreviews;
    /** Folds one event of the session's stream; false when the tables already hold it. */
    observe(event: SessionStreamEvent): boolean;
    /** Advances over source lines without recognized facts, after the reader commits the whole line. */
    advancePosition(position: number): void;
    /** Forgets a partly received line so a reader replaying from the folded cursor admits it again. */
    discardUncommitted(): void;
    /** Projects an answer only until its accepted delivery appears in the view. */
    answer(answers: readonly Answer[]): {
        (): void;
        accept: (deliveryId: string) => void;
    };
    /** Keeps the local echo's identity when its durable delivery replaces it. */
    confirmSubmission(id: string, deliveryId: string): void;
    /** A pending receipt has not yet identified which durable user row replaces its echo. */
    holdUnconfirmedMessages(hold: boolean): void;
    /** Shows, replaces, or removes the messages this client sent that eve hasn't consumed. */
    setSubmissions(submissions: readonly LocalSubmission[]): void;
    get submissions(): readonly LocalSubmission[];
    /** Updates a child observation without mixing its facts into this session's projection. */
    observeAgent(sessionId: string, observation: AgentObservation): void;
    /** The conversation as the tables and this client's own state now show it. */
    get state(): ConversationState;
}
/** The conversation a complete read of a session's stream shows. */
export declare function conversationOf(events: Iterable<SessionStreamEvent>): ConversationState;
