import type { ErrorInfo } from "#protocol/session-events/envelope.js";
import type { InteractionSubject } from "#protocol/session-events/families/interaction.js";
import type { CallRow, ChangeRow, DeliveryRow, InteractionRow, PartRow, ResponseRow, RunRow, SessionView, TaskRow, TurnRow } from "./tables.js";
/** The turn that is running or paused, if any. */
export declare function activeTurn(view: SessionView): TurnRow | undefined;
/**
 * The conversation as the model last saw it: the selected turn and the turns it follows back,
 * oldest first. The selected turn is the newest, unless a later context change chose another;
 * a clear selects none. A turn not retained here ends the walk.
 */
export declare function conversation(view: SessionView): readonly TurnRow[];
/** The content parts that answer a turn, in order. */
export declare function reply(view: SessionView, turnId: string): readonly PartRow[];
/** A turn's reply as text: its text parts, one per line. */
export declare function replyText(view: SessionView, turnId: string): string | undefined;
/**
 * The interactions each commit opened, oldest first: one batch is asked, and answered, together.
 * Sign-ins are connection work, not questions, and stay out unless asked for.
 */
export declare function interactionBatches(view: SessionView, options?: {
    readonly signIns?: boolean;
}): readonly (readonly InteractionRow[])[];
/** Why a turn failed, or why the session did. */
export declare function failure(view: SessionView, turnId?: string): ErrorInfo | undefined;
/** The call carrying a shared result. A reply stores its value once, not once per recipient. */
export declare function callOutputSource(view: SessionView, callId: string): CallRow | undefined;
/** True while any call the task serves is unsettled. Idle tasks don't hold the session open. */
export declare function isWorking(view: SessionView, taskId: string): boolean;
/** Tasks, optionally only the working or the idle ones. */
export declare function tasks(view: SessionView, filter?: {
    readonly status?: "working" | "idle" | "ended";
}): readonly TaskRow[];
/** Open interactions, oldest first; `about` includes interactions holding the entity's work. */
export declare function openInteractions(view: SessionView, filter?: {
    readonly kind?: string;
    readonly about?: InteractionSubject;
}): readonly InteractionRow[];
/**
 * Open interactions that hold an admitted answer: answered for now, waiting for the rest of
 * their batch to be decided. A typed reply moves on to the next request past them.
 */
export declare function answeredInteractionIds(view: SessionView): ReadonlySet<string>;
/** Deliveries admitted but not yet consumed or settled, in arrival order. */
export declare function queue(view: SessionView): readonly DeliveryRow[];
/**
 * True when nothing is happening and nothing will until another delivery arrives: no turn the
 * session works on or that waits on work, no working task, no open context change, and no queued
 * delivery. A turn waiting only on interactions is idle. An ended session is idle.
 */
export declare function idle(view: SessionView): boolean;
/** What an open turn waits on, when the session can do nothing more for it by itself. */
export type Waiting = {
    readonly on: "session";
} | {
    readonly on: "interaction";
    readonly interactions: readonly InteractionRow[];
} | {
    readonly on: "work";
    readonly calls: readonly CallRow[];
    readonly tasks: readonly TaskRow[];
};
/**
 * What an open turn waits on, read from the tables; `undefined` only for absent or settled turns.
 * `session` means the session can make progress by itself.
 *
 * The session works on a turn while it has a model run open, a context change running, an
 * answer it hasn't weighed, or a delivery the turn consumed after it last requested a run or
 * asked someone. Otherwise the
 * turn waits on an interaction while any unanswered interaction under it is open, and on work while
 * calls it made run, such as a workflow tool's run or a task it waits for. With neither, the
 * session has something to do: start or ask about requested calls, call the model, or end the
 * turn. So `session` means the session can make progress on this turn by itself.
 *
 * Rules of the stream make this exact at every line: anything that needs an answer is an
 * interaction; the line that makes a model call necessary requests the run; and every call
 * another run serves names its task when it starts.
 */
export declare function waiting(view: SessionView, turnId: string): Waiting | undefined;
/** The approval this session asked about a call itself, not one relayed from elsewhere. */
export declare function ownApproval(view: SessionView, callId: string): InteractionRow | undefined;
/**
 * Where a call stands, for a display: `requested` until the session starts it, `approval` while
 * its own approval is open, `running`, `blocked` while its work waits on an interaction, then how it
 * ended. A call interrupted or abandoned reads as `cancelled`; an outcome a newer writer adds
 * reads as `failed`.
 */
export type CallState = "requested" | "approval" | "running" | "blocked" | "completed" | "failed" | "rejected" | "cancelled";
/** Where a call stands; `undefined` for a call the tables don't hold. */
export declare function callState(view: SessionView, callId: string): CallState | undefined;
/**
 * A call's label: the one its tool gave its result or, while it runs, its latest progress; else
 * its capability's label, else its name as a title (`linear__list_issues` → `List issues`). A
 * `call.requested`'s data reads as its call's row did then.
 */
export declare function callLabel(row: Pick<CallRow, "capability"> & Partial<Pick<CallRow, "status" | "label">>, preview?: {
    readonly label?: string;
}): string;
/** What the session is doing right now, for status lines. */
export type Activity = {
    readonly kind: "idle";
} | {
    readonly kind: "thinking";
} | {
    readonly kind: "calling";
    readonly names: readonly string[];
} | {
    readonly kind: "waiting-on-interaction";
    readonly interactions: readonly InteractionRow[];
} | {
    readonly kind: "waiting-on-tasks";
    readonly tasks: readonly TaskRow[];
} | {
    readonly kind: "compacting";
};
/** What the session, or one turn, is doing right now. */
export declare function activity(view: SessionView, filter?: {
    readonly turnId?: string;
}): Activity;
/** The run that made a call, directly or through the calls it was made inside. */
export declare function callRun(view: SessionView, entry: CallRow): string | undefined;
/** The turn a call belongs to: the turn of the run that made it, or the turn that made it. */
export declare function callTurn(view: SessionView, entry: CallRow): string | undefined;
/** The task serving a call, directly or through a call it was made inside. */
export declare function callTask(view: SessionView, entry: CallRow): string | undefined;
/** The turn a run belongs to: the turn that requested it, or the turn its context change is in. */
export declare function runTurn(view: SessionView, runId: string): string | undefined;
/** The turn a part belongs to: its run's, or the turn that wrote it when no run did. */
export declare function partTurn(view: SessionView, row: PartRow): string | undefined;
/** What an owner leaves open: the entities that still need a terminal fact. */
export interface OpenWork {
    readonly calls: readonly CallRow[];
    readonly runs: readonly RunRow[];
    readonly changes: readonly ChangeRow[];
    readonly deliveries: readonly DeliveryRow[];
    readonly tasks: readonly TaskRow[];
    readonly interactions: readonly InteractionRow[];
    readonly responses: readonly ResponseRow[];
}
/** Where an interaction belongs: what its subject belongs to, through calls and responses. */
export interface InteractionOwner {
    readonly turnId?: string;
    readonly taskId?: string;
    readonly runId?: string;
    readonly changeId?: string;
}
/** The owner an interaction closes with: its turn, its task, or the run that made its call. */
export declare function interactionOwner(view: SessionView, entry: InteractionRow): InteractionOwner;
/**
 * The work still open under an owner, by ownership:
 *
 * - a run: the run and the calls it made, directly or inside other calls;
 * - a context change: the change, its runs, and their calls;
 * - a turn: its runs and their calls, the context changes inside it, and the deliveries it
 *   consumed. A task's calls belong to the task, so they survive closure of their run or turn;
 * - the session: everything.
 *
 * The turn and session rows themselves aren't included: their own terminal facts close them.
 */
export declare function openWork(view: SessionView, owner: {
    readonly runId: string;
} | {
    readonly changeId: string;
} | {
    readonly turnId: string;
} | {
    readonly taskId: string;
} | {
    readonly session: true;
}): OpenWork;
/** The turn an interaction is about, directly or through its call. */
export declare function subjectTurn(view: SessionView, entry: InteractionRow): string | undefined;
