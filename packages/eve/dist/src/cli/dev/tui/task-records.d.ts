import type { TaskRow, SessionView } from "#protocol/session-projection/tables.js";
import type { EveToolPart } from "#client/message-types.js";
import { type TaskRecord } from "./transcript-parts.js";
/**
 * The transcript's task records, one for each stretch of a task's work. A call that reaches a
 * task while one of its calls still works joins that task's record, as a model steering a working
 * agent does; a call that reaches it after it settled starts a new stretch with its own lines.
 */
export declare class TaskRecords {
    #private;
    /** Records in start order. */
    values(): IterableIterator<TaskRecord>;
    get(callId: string): TaskRecord | undefined;
    clear(): void;
    /** The record a task call belongs to, joining its task's working record or starting one. */
    record(part: EveToolPart, task: TaskRow, label: string | undefined, now: number, view: SessionView): TaskRecord;
}
