import type { WorkflowRunWithoutData, World } from '#compiled/@workflow/world/index.js';
import type { PayloadKey } from '../serialization/encryption.js';
/**
 * What every writer of a run's terminal event owes once the World recorded
 * it: the run's lifecycle hooks, and the completion hook of the parent that
 * started it, which may be suspended waiting on this run.
 *
 * Terminal events are written from many places (each engine's completion and
 * failure paths, fatal setup errors, max deliveries, replay timeout,
 * deployment mismatch, cancellation), so these are the only entry points: a
 * new terminal path that calls one of them cannot dispatch the lifecycle
 * hooks and forget the parent. `after-terminal-write.test.ts` fails on a
 * direct `dispatchRun*Hooks` call anywhere else.
 *
 * Call them only after the write succeeded: a parent that finds no
 * notification reads the child after registering its hook, and that read
 * must see the terminal event. None of them throws.
 */
/** The run as the caller has it (preferred, no read), or just its id. */
type TerminalRun = Pick<WorkflowRunWithoutData, 'runId' | 'executionContext'> | string;
/** After a `run_completed` write. */
export declare function afterRunCompleted(world: World, run: TerminalRun, workflowName: string): Promise<void>;
/**
 * After a `run_failed` write.
 *
 * @param error - The serialized error payload stored by the terminal write.
 * @param errorCode - The classification written to the event's `errorCode`.
 */
export declare function afterRunFailed(world: World, run: TerminalRun, workflowName: string, error: unknown, encryptionKey: PayloadKey | undefined, errorCode: string): Promise<void>;
/** After a `run_cancelled` write. Cancellation has no lifecycle hooks. */
export declare function afterRunCancelled(world: World, run: TerminalRun): Promise<void>;
export {};
//# sourceMappingURL=after-terminal-write.d.ts.map