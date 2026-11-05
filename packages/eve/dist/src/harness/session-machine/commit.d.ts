import type { SessionEvent } from "#protocol/session-event.js";
import type { ModelMessage } from "ai";
import { type HistoryChange } from "./history.js";
import type { Commit, HarnessSessionBase, SessionPublication, SessionStateMap } from "#harness/types.js";
import type { SessionProjection } from "#protocol/session-projection.js";
import { type HitlStateChange } from "#harness/hitl/requests.js";
import { type TurnState } from "./state.js";
import type { SessionView } from "./view.js";
declare const transitionBrand: unique symbol;
/** What a machine transition returns. Only the kernel builds one, through `transition`. */
export interface Transition extends HitlStateChange {
    readonly [transitionBrand]: true;
    readonly turn: TurnState;
    readonly events: readonly SessionEvent[];
    /** How the transition changes history: messages it commits, or a clear's empty history. */
    readonly history?: HistoryChange;
}
/** A change the kernel decided, as the transition the commit takes. Only the kernel calls this. */
export declare function transition<T extends Omit<Transition, typeof transitionBrand>>(change: T): T & Transition;
/** Kernel facts that change nothing private, as a transition that keeps the turn as it is. */
export declare function unchangedBy(commit: Commit, turn: TurnState): Transition;
/**
 * Publishes one transition's facts as one commit, or one progress record; `messages` is the
 * conversation as of the commit, for the reactions that read it.
 */
export type Publish = (publication: SessionPublication, messages?: readonly ModelMessage[]) => Promise<void>;
/**
 * The facts a kernel transition built, as the one commit the sink takes. Only the kernel calls
 * this; guard rule 51 counts any other caller.
 */
export declare function commitOf(facts: readonly SessionEvent[]): Commit;
/** Transitions decided together, as the one commit their facts make. */
export declare function commitTransitions(transitions: readonly Transition[]): Commit;
/**
 * Publications in order, with each run of commits joined into one, as one commit's facts are one
 * line. Progress stays its own.
 */
export declare function joinCommits(publications: readonly SessionPublication[]): SessionPublication[];
export declare function sessionView(projection: SessionProjection, state: SessionStateMap | undefined): SessionView;
/**
 * Publishes a transition's events as one commit, then saves what it changed. A transition that
 * changes history needs a session restored with it.
 */
export declare function applyTransition<T extends {
    readonly state?: SessionStateMap;
}>(session: T, transition: Transition, publish: Publish, messages?: readonly ModelMessage[]): Promise<T>;
/** Saves what a transition changes once its events are published. */
export declare function saveTransition<T extends {
    readonly state?: SessionStateMap;
}>(session: T, transition: Transition): T;
/** The messages a transition commits to the end of history. */
export declare function committedMessages(transition: Transition): readonly ModelMessage[];
/**
 * Drops the private records whose row the projection shows done, the one way they retire: a
 * relay's route once its asker settles the interaction, and a responder's once their answer
 * settled. Admitted answers can still be refused while the rest of their batch waits.
 */
export declare function dropClosedRecords<T extends HarnessSessionBase>(session: T, projection: SessionProjection): T;
export {};
