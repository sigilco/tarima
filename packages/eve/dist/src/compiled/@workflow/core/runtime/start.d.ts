import type { RunRetention, StartHook, World } from '#compiled/@workflow/world/index.js';
import type { StringValue } from '../_ms.js';
import { type DynamicStartOptions } from './dynamic-workflow.js';
import { type HealthCheckResult } from './helpers.js';
import { Run } from './run.js';
/**
 * Where a run's stamped spec version came from, recorded on the `start()`
 * span so "why is this run on spec N?" is answerable without reading code.
 */
export type SpecVersionSource = 'same-deployment' | 'explicit' | 'probe' | 'probe-unversioned' | 'probe-malformed' | 'probe-miss' | 'no-probe-channel';
/**
 * The spec version to stamp on a run that another deployment will execute.
 *
 * A run's spec version is a promise about the runtime that reads and writes
 * its event log, and for a cross-deployment start that is the target, not
 * this caller. The capability probe runs inside the target and reports the
 * version the target itself mints (which already honours the target's own
 * `WORKFLOW_SPEC_VERSION` and `WORKFLOW_SEALED_LOG` settings), so that is the
 * answer, capped at what this caller's World mints: the caller writes
 * `run_created` and the arguments, and must never stamp a version it could
 * not have written itself. A spec 9 run therefore needs
 * `WORKFLOW_SPEC_VERSION=9` on both the caller and the target.
 *
 * When the target does not report a usable version:
 *
 * - a plain-text reply predates the versioned JSON health response, which
 *   arrived with spec 3 (CBOR queue transport), so it is stamped as
 *   event-sourced: such a target cannot read a CBOR `runInput`.
 * - a JSON reply without a usable `specVersion` still proves the target is
 *   at spec 3 or later, so it is stamped with CBOR queue transport rather
 *   than losing it (and resilient start with it) to a malformed field.
 * - a probe that times out, or no probe channel at all, is a guess.
 *   `SPEC_VERSION_SUPPORTS_SLOT_IDENTITY` is the lowest version a v5 runtime
 *   can execute on the Vercel World (it requires slot event ids), so it is
 *   the only floor that keeps same-major targets working. It is NOT safe for
 *   an older-major target such as `stable` (spec 3): that target rejects the
 *   run when it picks it up. No single floor serves both, which is why the
 *   probe budget is generous; the miss is logged and recorded on the span.
 *
 * Once executors attest their version on `run_started` and the backend
 * raises a run to it (vercel/workflow#4366, vercel/workflow-server#1044), a
 * v5 target heals an under-stamped run, and this miss floor may drop, but
 * only once the raise is enabled on the whole server fleet AND every v5
 * target a caller can reach attests its version (a published beta that does
 * not would be stamped below slot identity and fail). Even then a floor
 * below `SPEC_VERSION_SUPPORTS_ATTRIBUTES` would refuse `attributes` on every
 * miss. Tracked in vercel/workflow#4401.
 *
 * Exported for tests.
 */
export declare function resolveCrossDeploymentSpecVersion(probe: Pick<HealthCheckResult, 'healthy' | 'specVersion' | 'format'> | undefined, callerSpecVersion: number): {
    specVersion: number;
    source: SpecVersionSource;
};
/**
 * Reset the `deploymentId: 'latest'` no-op warn-once guard. Test-only,
 * exported so unit tests can exercise the warn path across `start()` calls.
 *
 * @internal
 */
export declare function _resetLatestNoOpWarnForTests(): void;
/**
 * Reset the cross-deployment probe-miss warn-once guard. Test-only.
 *
 * @internal
 */
export declare function _resetProbeMissWarnForTests(): void;
/**
 * `start(workflow, args, { experimental_hook })`: the run's start Hook. The World creates
 * this Hook in the same step that admits the run, so at most one run holds
 * the token, and the Hook can be looked up (`getHookByToken()`) and resumed
 * (`resumeHook()`) as soon as `start()` returns, before the run has started.
 * Payloads resumed before the workflow opens the Hook wait for it and are
 * delivered in order.
 *
 * Inside the run, `createHook({ token })` with the same token opens this
 * Hook; it writes nothing. The Hook then follows the ordinary Hook lifecycle,
 * exactly like one the run created with
 * `createHook({ token, experimental_minRetention })`: disposing it releases
 * the token at once (so open it with `const` to keep the token for the whole
 * run), and without a retention the run's end releases it too.
 */
export interface StartHookOptions {
    /**
     * The Hook token for the run. Non-empty. Another run that holds the token,
     * whether through its own `start({ experimental_hook })` or a `createHook()`, makes this
     * start throw `HookConflictError` naming it.
     */
    token: string;
    /**
     * **Experimental.** Keep the token unavailable for at least this long, even
     * after the run ends. Accepts the same duration string, millisecond number,
     * or absolute `Date` as `sleep()` and `createHook({ experimental_minRetention })`.
     * A duration starts when `start()` is called. Without it, the token is
     * released when the run ends. Disposing the Hook releases the token at
     * once either way.
     */
    experimental_minRetention?: StringValue | Date | number;
    /**
     * Data stored with the Hook, with the same semantics and serialization as
     * `createHook({ metadata })`, so `getHookByToken()` returns it.
     */
    metadata?: unknown;
}
/**
 * Validates and resolves `start({ experimental_hook })` before anything is written. The
 * metadata is applied later, once the run's key is known. Exported for
 * tests.
 */
export declare function normalizeStartHook(options: StartHookOptions): StartHook;
/**
 * Backoff between the re-posts with which `start({ experimental_hook })` confirms an
 * uncertain admission before throwing `WorkflowStartError`. The decision
 * replays, so re-posting the same candidate is free and learns it. Giving up
 * at the first uncertain answer would leave a streamed owner that was in fact
 * admitted waiting on input nothing will send, and would send a caller (a
 * step's retry, with a new run ID) into a conflict naming its own run.
 */
export declare const START_HOOK_CONFIRM_DELAYS_MS: readonly number[];
export interface StartOptionsBase {
    /**
     * Create a Hook with this token atomically with the run's admission,
     * making the start idempotent on that token. If another run holds the
     * token, `start()` throws `HookConflictError` with `conflictingRunId`, and
     * the duplicate never becomes a run: no run is created and none of its
     * code executes.
     *
     * The Hook exists as soon as `start()` returns: `resumeHook(token)` reaches
     * the run at once, and the payloads wait until the workflow opens the Hook
     * with `createHook({ token })`. When `start()` cannot confirm whether the
     * candidate was queued or admitted it throws `WorkflowStartError`; retrying
     * with the same token can never admit a second owner.
     *
     * Requires a World that supports atomic start Hooks (and, with a
     * retention, Hook retention). Not supported for dynamic workflows.
     */
    experimental_hook?: StartHookOptions;
    /**
     * The world to use for the workflow run creation,
     * by default the world is inferred from the environment variables.
     */
    world?: World;
    /**
     * The spec version to use for the workflow run. Defaults to the spec
     * version of the deployment that will execute the run: the configured
     * World's for a same-deployment start, and for a cross-deployment start
     * (`deploymentId` naming another deployment) the version the target
     * reports on its capability probe, capped at the configured World's.
     */
    specVersion?: number;
    /**
     * Optional region identifier for the new run. Currently consumed only
     * by `@workflow/world-vercel`, which embeds the region into the tagged
     * run ID and routes the initial workflow message to the matching
     * regional queue. When omitted, the world falls back to its own
     * default (for `world-vercel`: the `VERCEL_REGION` environment
     * variable, then the server-side default region `iad1`; a concrete,
     * routable region is always chosen).
     *
     * Worlds without a regional dimension ignore this field.
     */
    region?: string;
    /**
     * Plaintext attributes to seed on the run as it is created.
     *
     * Available for native-attributes runs (spec version 4 and later).
     */
    attributes?: Record<string, string>;
    /**
     * Permit reserved `$`-prefixed keys in `attributes`. The `$` namespace
     * is reserved for framework/library code built on top of the workflow
     * SDK (telemetry, agent metadata, platform-emitted tags, etc.); user
     * code MUST NOT write keys in it, and validation rejects them so
     * accidental collisions with tooling-owned keys can't slip through.
     *
     * Only flip this to `true` if your caller is itself a framework or
     * library that owns a `$`-prefixed sub-namespace and knows the
     * conventions of any other tools writing into it. Same semantics as
     * the `setAttributes` option of the same name.
     */
    allowReservedAttributes?: boolean;
    /**
     * Set a preference for data retention after run completion.
     *
     * **Experimental.** Both the unit and the set of accepted values are expected
     * to change.
     *
     * Worlds control the retention of user data (event payloads and stream
     * chunks), the event log, and any analytics data. Options are:
     * - `'default'`: same as omission, the World will decide. On Vercel, this
     *   is based on your team's plan.
     * - `0`: data is deleted as soon as your run completes or fails. On
     *   Vercel, user data is deleted, but metadata may persist for your plan's
     *   default retention period.
     *
     * The value is a duration, with zero being the only valid option currently.
     *
     * **Known limitation at `0`.** The purge races your own read of the run's
     * result and generally wins, so `await run.returnValue` on a
     * `experimental_retention: 0` run usually throws `RunExpiredError` rather
     * than resolving. If you need the result, return it through a channel you
     * control, e.g. a step that writes it to external storage.
     *
     * Recorded on the run as the reserved `$retention` attribute, so it
     * requires a World implementing spec version 4 or later. `'default'` is
     * not written at all, keeping it exactly equivalent to omitting the
     * option. Retention is enforced by the World: the first-party Worlds
     * (Vercel, Local, Postgres) implement it, and a World that does not
     * recognize the value keeps the data.
     */
    experimental_retention?: RunRetention;
    /**
     * Set to `false` to store the run's arguments uncompressed.
     *
     * Arguments are compressed by default when the target run can decode
     * them. The attempt costs CPU proportional to the input size and is
     * wasted on incompressible data (media, encrypted or random bytes),
     * so callers that know their inputs will not shrink can skip it.
     *
     * `true` is the default and does not force compression: a target that
     * cannot decode compressed payloads, or a process with
     * `WORKFLOW_DISABLE_COMPRESSION=1` set, still stores them uncompressed.
     * This option is the per-call counterpart of that environment variable
     * and only affects the arguments; a dynamic workflow's code is
     * compressed regardless.
     */
    compressArguments?: boolean;
    /**
     * The ID of an existing run this run is being replayed from, if any.
     *
     * Recorded on the new run's `executionContext` as `replayedFromRunId` so
     * tooling (e.g. the dashboard runs list) can show that a run originated as
     * a replay and link back to its source. Set automatically by
     * {@link recreateRunFromExisting}; there's usually no reason to pass it
     * directly.
     *
     * Must be a run ID: `wrun_` followed by a 26-char ULID. It's a foreign key
     * to the source run, so `start()` validates the exact shape and rejects
     * anything else rather than persist a lineage link that points at garbage.
     */
    replayedFromRunId?: string;
    /**
     * Queue namespace of the target deployment. Scopes the workflow queue
     * topic to `__{namespace}_wkf_workflow_*` (e.g. `'eve'`) instead of the
     * default `__wkf_workflow_*`, and is also used for the cross-deployment
     * capability probe. Falls back to `WORKFLOW_QUEUE_NAMESPACE` in the
     * calling process.
     *
     * Within a deployment the env fallback is correct. Cross-context callers
     * (e.g. the observability dashboard replaying a run) must pass the
     * TARGET deployment's namespace explicitly: the env fallback resolves in
     * the caller's process, and a run enqueued to a topic the target has no
     * consumer for is never picked up.
     */
    namespace?: string;
}
export interface StartOptionsWithDeploymentId extends StartOptionsBase {
    /**
     * The deployment ID to use for the workflow run.
     *
     * By default, this is automatically inferred from environment variables
     * when deploying to Vercel.
     *
     * Set to `'latest'` to automatically resolve the most recent deployment
     * for the current environment (same production target or git branch).
     * This is only meaningful in worlds with atomic, immutable deployments
     * (currently Vercel). In other worlds (local dev, Postgres) there is no
     * notion of multiple deployments to resolve between, so `'latest'` has no
     * effect: a warning is logged and the run targets the current deployment.
     *
     * **Note:** When `deploymentId` is provided, the argument and return types become `unknown`
     * since there is no guarantee the types will be consistent across deployments.
     */
    deploymentId: 'latest' | (string & {});
}
export interface StartOptionsWithoutDeploymentId extends StartOptionsBase {
    deploymentId?: undefined;
}
/**
 * Options for starting a workflow run.
 */
export type StartOptions = StartOptionsWithDeploymentId | StartOptionsWithoutDeploymentId;
export type { DynamicStartOptions, DynamicWorkflowOptions, DynamicWorkflowStepReference, } from './dynamic-workflow.js';
/**
 * Represents an imported workflow function.
 */
export type WorkflowFunction<TArgs extends unknown[], TResult> = (...args: TArgs) => Promise<TResult>;
/**
 * Represents the generated metadata of a workflow function.
 */
export type WorkflowMetadata = {
    workflowId: string;
};
/**
 * Starts a workflow run.
 *
 * @param workflow - The imported workflow function to start.
 * @param args - The arguments to pass to the workflow (optional).
 * @param options - The options for the workflow run (optional).
 * @returns The unique run ID for the newly started workflow invocation.
 */
export declare function start<TArgs extends unknown[], TResult>(workflow: WorkflowFunction<TArgs, TResult> | WorkflowMetadata, args: unknown[], options: StartOptionsWithDeploymentId): Promise<Run<unknown>>;
export declare function start<TResult>(workflow: WorkflowFunction<[], TResult> | WorkflowMetadata, options: StartOptionsWithDeploymentId): Promise<Run<unknown>>;
export declare function start<TArgs extends unknown[], TResult>(workflow: WorkflowFunction<TArgs, TResult> | WorkflowMetadata, args: TArgs, options?: StartOptionsWithoutDeploymentId): Promise<Run<TResult>>;
export declare function start<TResult>(workflow: WorkflowFunction<[], TResult> | WorkflowMetadata, options?: StartOptionsWithoutDeploymentId): Promise<Run<TResult>>;
export declare function start(source: string, args: unknown[], options: DynamicStartOptions): Promise<Run<unknown>>;
export declare function start(source: string, options: DynamicStartOptions): Promise<Run<unknown>>;
//# sourceMappingURL=start.d.ts.map