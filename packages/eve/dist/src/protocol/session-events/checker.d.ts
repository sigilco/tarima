import type { StoredLine } from "./envelope.js";
import type { SessionView } from "../session-projection/tables.js";
export interface Violation {
    readonly position: number;
    /** The fact's index in its commit; absent for a progress record or the whole line. */
    readonly index?: number;
    readonly type?: string;
    readonly rule: ViolationRule;
    readonly message: string;
}
export type ViolationRule = "envelope" | "schema" | "introduce-before-reference" | "introduced-twice" | "one-terminal" | "closed-outcome" | "closure" | "after-session-end" | "one-open-turn" | "attempts" | "progress" | "paused-on-person" | "serves-running-task" | "batch-settles-together" | "cleared-before-start";
export interface StreamChecker {
    /** Checks the next line. Positions must increase; a repeated position is a duplicate, skipped. */
    check(line: StoredLine, position: number): readonly Violation[];
}
export declare function createStreamChecker(options?: {
    /** Schema validation, from `schemas.ts`, for tests and development. */
    readonly validate?: (record: unknown, kind: "fact" | "progress") => string | undefined;
    /** Check from a checkpoint's operational view, including retained ownership ancestors.
     * Forgotten history cannot establish global identity uniqueness; full-stream checks can.
     */
    readonly seed?: SessionView;
}): StreamChecker;
