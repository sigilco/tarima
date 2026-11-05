/**
 * The tasks a turn has working: agents and tools that keep running while the
 * turn goes on. The transcript only ever grows at its end, so a task writes
 * one line when it starts and one when it ends; what it is doing in between
 * lives here in the activity drawer above the prompt, keeping live updates
 * out of immutable terminal scrollback.
 */
import type { Block } from "./blocks.js";
import type { Theme } from "./theme.js";
export type TaskKind = "agent" | "tool";
export interface TaskEntry {
    readonly callId: string;
    readonly kind: TaskKind;
    /** Display name, unique among working tasks. */
    readonly name: string;
    readonly toolName: string;
    readonly input: unknown;
    readonly label: string | undefined;
    readonly startedAtMs: number;
    readonly purpose?: string;
    readonly children?: readonly TaskEntry[];
    readonly omittedTasks?: number;
    readonly omittedAttention?: boolean;
    /** An agent's latest words or thinking, one line. */
    step?: string;
    /** Settled, waiting only for the agent's own last events. */
    finishing?: boolean;
    /** An agent's own tool calls, newest last, for its activity and summary. */
    readonly childTools: Map<string, Block>;
}
/** Joins the working tasks' names for the turn bar: `Waiting for researcher and reviewer`. */
export declare function waitingLabel(entries: readonly TaskEntry[]): string;
/** Names the connections a parked session waits on: `Waiting for sign-in to Linear`. */
export declare function signInLabel(names: readonly string[]): string;
export declare function renderTaskPanelRows(entries: readonly TaskEntry[], options: {
    readonly width: number;
    readonly theme: Theme;
    readonly nowMs: number;
    readonly activity?: string;
    readonly turnElapsedMs?: number;
    readonly maxRows?: number;
}): string[];
