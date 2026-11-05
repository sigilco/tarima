import { WorkflowRunFailedError } from '#compiled/@workflow/errors/index.js';
import type { PayloadKey } from '../serialization/encryption.js';
import { Run } from './run.js';
interface RunHookParams {
    /**
     * The machine-readable workflow identifier, such as
     * `workflow//./src/workflows/order//processOrder`, available without a read.
     * Unlike this string, `run.workflowName` is a Promise that fetches metadata.
     */
    workflowName: string;
    /**
     * The transitioned run. The instance hydrates lazily, so reading
     * `run.returnValue` (or any other accessor) fetches from the backend only
     * when the handler actually uses it.
     */
    run: Run<unknown>;
}
/** Parameters passed to an {@link WorkflowLifecycleHooks.onRunCompleted} handler. */
export type RunCompletedHookParams = RunHookParams;
/**
 * Parameters passed to an {@link WorkflowLifecycleHooks.onRunFailed}
 * handler.
 */
export interface RunFailedHookParams extends RunHookParams {
    /**
     * The persisted failure hydrated for reporting. Unlike `run.returnValue`,
     * readable streams load only when consumed and abort signals reflect their
     * persisted state without live subscriptions. Writable streams retain their
     * normal forwarding setup.
     *
     * This `WorkflowRunFailedError` has an `errorCode` carrying the failure
     * classification (e.g. `USER_ERROR`, `RUNTIME_ERROR`). Its `cause` is
     * the hydrated persisted value. Custom serialization revives registered
     * classes using the runtime's module copy, which may differ from the
     * handler's copy. Use error-class `.is()` helpers rather than `instanceof`.
     * If hydration fails, `cause` is a generic Error, matching
     * `run.returnValue`'s fallback.
     */
    error: WorkflowRunFailedError;
}
/**
 * Global handlers observing workflow run lifecycle transitions. Register via
 * {@link registerLifecycleHooks}.
 */
export interface WorkflowLifecycleHooks {
    /** Invoked when a workflow run completes successfully. */
    onRunCompleted?: (params: RunCompletedHookParams) => void | Promise<void>;
    /** Invoked when a workflow run fails terminally (after any retries). */
    onRunFailed?: (params: RunFailedHookParams) => void | Promise<void>;
}
/**
 * Registers global workflow lifecycle handlers, invoked by the runtime on
 * the compute that records a run's terminal transition. Useful for
 * centralized reporting (e.g. forwarding failed runs to Sentry) without
 * wrapping every workflow body.
 *
 * Register in the host process that executes workflows, before it handles
 * requests, never in a workflow or step. In Next.js 16.3+ use
 * `instrumentation.ts`; restart `next dev` after editing handlers. App startup
 * registration does not reach the separate flow functions emitted by the
 * Vercel Build Output API integrations. See the lifecycle hooks guide for
 * framework-specific support and registration locations.
 *
 * Semantics:
 * - Handlers run on the host (full Node.js), never inside the workflow VM.
 * - Handlers fire only on the invocation that actually wrote the terminal
 *   event. Transitions recorded elsewhere (e.g. a run cancelled from the
 *   CLI or dashboard) do not fire handlers in the app.
 * - Handlers are fire-and-forget: they cannot delay or change the run's
 *   outcome, and a throwing handler is logged and swallowed. On Vercel,
 *   `waitUntil` keeps the invocation alive for handlers and background stream
 *   operations from the hydrated failure. On other hosts handlers run
 *   detached, and freezing serverless hosts may not let them finish.
 * - Reporting is best effort: callbacks are not retried if the invocation
 *   dies before they finish. Use the event log as the system of record.
 * - Multiple registrations are allowed; handlers run in registration order.
 *   Registrations are not deduplicated. Unregister the previous hooks before
 *   registering again during hot reload or module re-evaluation.
 *
 * @returns A function that unregisters these hooks.
 */
export declare function registerLifecycleHooks(hooks: WorkflowLifecycleHooks): () => void;
/**
 * Called by the runtime after it successfully wrote a `run_completed` event.
 * Never throws.
 */
export declare function dispatchRunCompletedHooks(runId: string, workflowName: string): void;
/**
 * Called by the runtime after it successfully wrote a `run_failed` event.
 * Never throws.
 *
 * @param error - The serialized error payload stored by the terminal write.
 * @param errorCode - The classification written to the event's `errorCode`.
 */
export declare function dispatchRunFailedHooks(runId: string, workflowName: string, error: unknown, encryptionKey: PayloadKey | undefined, errorCode: string): void;
export {};
//# sourceMappingURL=lifecycle-hooks.d.ts.map