import type { ContextReader } from "#context/key.js";
/** Framework-owned provenance for the scheduled work that started the current turn. */
export interface SessionSchedule {
    readonly definition: string;
    readonly instance?: string;
    readonly occurrenceId?: string;
}
export declare function readSerializedSessionSchedule(values: Readonly<Record<string, unknown>>): SessionSchedule | undefined;
export declare function readSessionSchedule(context: Pick<ContextReader, "get">): SessionSchedule | undefined;
