import type { SessionStreamEvent } from "#protocol/session-event.js";
import type { ConversationState, FollowAgents } from "#client/conversation-state.js";
import { type LocalSubmission } from "#client/conversation.js";
import type { SendTurnPayload } from "#client/types.js";
import type { SessionView } from "#protocol/session-projection/tables.js";
import type { Answer } from "#shared/input.js";
import { SessionEventStream, type SessionEventStreamOptions } from "#client/session-event-stream.js";
import type { ClientSession } from "#client/session.js";
/** Owns one client session's conversation and its root and agent-session transports. */
export declare class ConversationClient {
    #private;
    constructor(onChange: () => void);
    get conversation(): ConversationState;
    get view(): SessionView;
    confirmSubmission(id: string, deliveryId: string): void;
    holdUnconfirmedMessages(hold: boolean): void;
    get streaming(): boolean;
    /** Shows the messages this client sent that eve hasn't consumed. */
    showSubmissions(submissions: readonly LocalSubmission[]): void;
    /** Projects answers during the POST round trip, then hands ownership to the view. */
    projectAnswers(answers: readonly Answer[] | undefined): {
        (): void;
        accept: (deliveryId: string) => void;
    } | undefined;
    /** Swaps shown answers for a prepared payload's, which must still be answerable. */
    replaceAnswers(retract: ReturnType<ConversationClient["projectAnswers"]>, input: SendTurnPayload): {
        (): void;
        accept: (deliveryId: string) => void;
    } | undefined;
    /** Admits and folds a root event before the agent sessions it announces are followed. */
    observe(event: SessionStreamEvent, options?: {
        /** Reconciles the messages this client sent with the event. */
        reconcile?: (event: SessionStreamEvent) => void;
        /** Records the accepted event before it folds or children hear of it. */
        onAccepted?: (event: SessionStreamEvent) => void;
        /** The store publishes after updating its event log and status. */
        notify?: boolean;
    }): boolean;
    /** Called after the store has published the root's matching event prefix and lifecycle. */
    reconcileFollowing(): void;
    /** Admits and folds a saved root event without notifying subscribers. */
    hydrate(event: SessionStreamEvent): boolean;
    /** Starts following the agent sessions the root stream has announced so far. */
    follow(session: ClientSession, policy: FollowAgents): void;
    /** Follows the root session continuously; operation readers subscribe to this one stream. */
    stream(session: ClientSession, options: SessionEventStreamOptions): SessionEventStream;
    /** Closes the root stream; the next read replays any partial line from the folded cursor. */
    closeStream(): void;
    stop(): void;
    reset(): void;
}
