import type { InteractionOutcome, InteractionRequest, SignInChallenge } from "#protocol/session-events/families/interaction.js";
import type { Answer } from "#protocol/session-events/families/response.js";
import type { JsonValue, Principal } from "#protocol/session-events/envelope.js";
import type { InteractionRow, SessionView } from "#protocol/session-projection/tables.js";
/** Where a model run's output goes: its turn, and its step, the run's place among its turn's. */
export interface RunPlace {
    readonly turnId: string;
    readonly stepIndex: number;
}
export declare function runPlace(view: SessionView, runId: string | undefined): RunPlace | undefined;
/** Where a part goes: its run's place, or its turn's latest step for a part no run wrote. */
export declare function partPlace(view: SessionView, row: {
    readonly runId?: string;
    readonly turnId?: string;
    readonly introducedAt?: number;
}): RunPlace | undefined;
/** A turn's latest step as of a position: the place of its last run introduced by then. */
export declare function turnStepAt(view: SessionView, turnId: string, position?: number): number;
/** Where a call belongs: its run's place, or its turn's latest step when no run of a turn made it. */
export declare function callPlace(view: SessionView, callId: string): RunPlace | undefined;
/** Why a request nobody answered closed when a message steered its turn instead. */
export declare const SUPERSEDED_BY_MESSAGE = "superseded-by-message";
/** The call an interaction asks about. */
export interface AskedCall {
    readonly callId: string;
    readonly name: string;
    readonly input?: JsonValue;
}
/**
 * The call an interaction asks about, such as the tool an approval would run: a relayed
 * request's asker's call, which lives in the child's session, or else the subject's call here.
 */
export declare function askedCall(view: SessionView, row: InteractionRow): AskedCall | undefined;
/** Where an interaction opened: the turn it holds, its step then, and the task whose run asks. */
type InteractionPlace = Pick<Interaction, "turnId" | "stepIndex" | "taskId">;
export declare function interactionPlace(view: SessionView, row: InteractionRow): InteractionPlace;
/** An interaction as a conversation reader shows it: what it asks, where, and how it stands. */
export interface Interaction {
    readonly interactionId: string;
    readonly turnId: string;
    readonly stepIndex: number;
    readonly taskId?: string;
    readonly request: Omit<InteractionRequest, "signIn"> & {
        readonly signIn?: Omit<SignInChallenge, "callbackUrl">;
    };
    readonly call?: AskedCall;
    readonly status: "open" | "settled";
    readonly outcome?: InteractionOutcome;
    readonly reason?: string;
    /** The deciding answer once settled; while open, the latest unsettled submitted answer. */
    readonly answer?: Answer;
}
export declare function interaction(view: SessionView, interactionId: string): Interaction | undefined;
/** The answer that decided a settled interaction, as it was given. */
export declare function decidingAnswer(row: InteractionRow): Answer | undefined;
/** Who gave an answer: the principal of the delivery it arrived in. */
export declare function responderOf(view: SessionView, responseId: string): Principal | undefined;
/**
 * The approvals, questions, and budget prompts the session still waits on an answer to, oldest
 * first: the server's one source for whether a request is open. A sign-in completes by its
 * callback, not an answer (`openSignIns`).
 */
export declare function openRequests(view: SessionView | undefined): readonly InteractionRow[];
/** Sign-ins the session still waits on, in the order they opened. */
export declare function openSignIns(view: SessionView | undefined): readonly InteractionRow[];
/** How a sign-in's end reads to a person: connected, or why it didn't. */
export declare function signInEnding(outcome: InteractionOutcome): "connected" | "declined" | "failed" | "timed out" | "cancelled";
/** The prompt a text-only channel displays: budget first, then the oldest unanswered request. */
export declare function promptQueueHead(view: SessionView, answered?: (interactionId: string) => boolean): InteractionRow | undefined;
export {};
