import type { CallRow, ChangeRow, ChildRow, DeliveryRow, InteractionRow, PartRow, ResponseRow, RunRow, SessionView, TaskRow, TurnRow } from "#protocol/session-projection/tables.js";
/** The families of entities a session's tables hold. */
export type Family = "turn" | "run" | "change" | "call" | "task" | "interaction" | "response" | "delivery" | "child" | "part";
/** One entity: its family and id. */
export interface Ref {
    readonly family: Family;
    readonly id: string;
}
interface Rows {
    readonly turn: TurnRow;
    readonly run: RunRow;
    readonly change: ChangeRow;
    readonly call: CallRow;
    readonly task: TaskRow;
    readonly interaction: InteractionRow;
    readonly response: ResponseRow;
    readonly delivery: DeliveryRow;
    readonly child: ChildRow;
    readonly part: PartRow;
}
declare const TABLES: {
    readonly call: "calls";
    readonly change: "changes";
    readonly child: "children";
    readonly delivery: "deliveries";
    readonly interaction: "interactions";
    readonly part: "parts";
    readonly response: "responses";
    readonly run: "runs";
    readonly task: "tasks";
    readonly turn: "turns";
};
/** The table that holds a family's rows. */
export declare function tableOf(family: Family): (typeof TABLES)[Family];
export declare function rowOf<F extends Family>(view: SessionView, family: F, id: string): Rows[F] | undefined;
/** A reference written as on the wire, `{ turnId }` or `{ callId }`, as a `Ref`. */
export declare function refOf(keyed: Readonly<Record<string, string>> | undefined): Ref | undefined;
/**
 * The owner of an entity, whose end ends it; `undefined` for one the session owns. A call
 * belongs to the run that made it while the run streams; once the run completes, the call goes
 * on under the run's turn or context change, and a call a task serves belongs to the task. A
 * delivery belongs to the turn that consumed it.
 */
export declare function parentOf(view: SessionView, ref: Ref): Ref | undefined;
/** An entity's owners, nearest first. Stops at a cycle, which a malformed stream could hold. */
export declare function ancestors(view: SessionView, ref: Ref): Ref[];
/** The nearest owner of `family` above an entity, itself included. */
export declare function ownerOf(view: SessionView, ref: Ref, family: Family): string | undefined;
/** Whether an entity is open: introduced and not yet closed. */
export declare function isOpen(view: SessionView, ref: Ref): boolean;
/**
 * Every open entity under `owner`, or under the session, leaves first: closing them in this
 * order closes each before what owns it, and a responder's sign-in before its response.
 */
export declare function openUnder(view: SessionView, owner: Ref | "session"): Ref[];
/**
 * The owners a fact about an entity belongs to, for readers that don't fold: the turn, task,
 * run, and change at or above it. A call also names the turn whose run made it, even once a
 * task serves it.
 */
export declare function scopeOf(view: SessionView, ref: Ref): {
    turnId?: string;
    taskId?: string;
    runId?: string;
    changeId?: string;
};
/**
 * The turn an entity belongs to: the turn at or above it, the turn whose run made a call, or for
 * what a task owns, the turn whose call started the task.
 */
export declare function turnOf(view: SessionView, ref: Ref): string | undefined;
export {};
