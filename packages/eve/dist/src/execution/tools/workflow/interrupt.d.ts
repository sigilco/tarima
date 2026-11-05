import type { WorkflowToolRunAddress } from "#execution/tools/workflow/types.js";
/**
 * Aborts the `execute` call's `abortSignal`. A turn steered right after it
 * started the run can get here before the run registers its control hook, so
 * a live run's missing hook is waited for. A run that ended has nothing left
 * to interrupt. A run still without its hook at the deadline fails the step,
 * which the runtime retries, since the interrupt was not delivered.
 */
export declare function interruptWorkflowToolRun(run: WorkflowToolRunAddress): Promise<void>;
