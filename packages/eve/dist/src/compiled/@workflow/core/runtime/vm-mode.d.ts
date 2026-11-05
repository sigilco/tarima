/**
 * VM engine selection for workflow execution.
 *
 * The Node.js `node:vm` engine is the default. The QuickJS WASM engine is
 * opt-in via the `WORKFLOW_VM` env var or `executionContext.workflowVm`.
 *
 * Both engines implement the same event-replay execution model: on every
 * workflow handler invocation the workflow function is re-executed from the
 * top and the recorded event log resolves awaited primitives. The QuickJS
 * engine runs the workflow code in a QuickJS WASM VM (via quickjs-wasi)
 * instead of a `node:vm` context, which makes it usable on platforms that
 * do not implement `node:vm` (e.g. Cloudflare Workers) and is the
 * foundation for VM-memory snapshotting.
 */
import type { WorkflowRun } from '#compiled/@workflow/world/index.js';
/**
 * Known workflow VM engines. Any other `WORKFLOW_VM` value is treated as
 * a misconfiguration and rejected at startup.
 */
export declare const WORKFLOW_VMS: readonly ["node", "quickjs"];
export type WorkflowVmMode = (typeof WORKFLOW_VMS)[number];
/**
 * Read and validate the `WORKFLOW_VM` env var.
 *
 * Returns the configured engine, or `undefined` if unset/empty.
 * Throws {@link WorkflowRuntimeError} if the value is set but not one of
 * the known engines, since catching misconfiguration early is better than
 * silently falling back to the default.
 */
export declare function getWorkflowVmFromEnv(env?: NodeJS.ProcessEnv): WorkflowVmMode | undefined;
/**
 * Whether to use the QuickJS WASM VM for a given run.
 *
 * The run's `executionContext.workflowVm` (stamped by the SDK at `start()`
 * when `WORKFLOW_VM` is set on the client) takes precedence so a run keeps
 * executing on the engine it started on. When the run doesn't specify an
 * engine, the `WORKFLOW_VM` env var on the workflow handler decides.
 * The default is the `node:vm` engine.
 *
 * Throws if `WORKFLOW_VM` or `executionContext.workflowVm` is set to an
 * unknown value.
 */
export declare function useQuickJSVm(workflowRun: Pick<WorkflowRun, 'executionContext'>): boolean;
/**
 * Snapshot threshold the QuickJS engine uses when neither the run's
 * `executionContext` nor `WORKFLOW_SNAPSHOT_THRESHOLD` specifies one.
 * Short runs (most workflows) never reach it and so never pay the
 * snapshot cost; long-running runs stop scaling their resume cost with
 * total event-log length. Set `WORKFLOW_SNAPSHOT_THRESHOLD=0` to opt out.
 */
export declare const DEFAULT_QUICKJS_SNAPSHOT_THRESHOLD = 1000;
/**
 * Read and validate the `WORKFLOW_SNAPSHOT_THRESHOLD` env var.
 *
 * The threshold is the number of processed events after which the QuickJS
 * engine persists a VM-memory snapshot at suspension, so subsequent
 * invocations restore the VM and replay only the events recorded since —
 * instead of re-executing the workflow from the top against the full log.
 *
 * When unset, the QuickJS engine uses
 * {@link DEFAULT_QUICKJS_SNAPSHOT_THRESHOLD}. `0` explicitly disables
 * snapshotting. `1` effectively snapshots at every suspension.
 *
 * Returns the configured threshold, or `undefined` if unset/empty.
 * Throws {@link WorkflowRuntimeError} for non-integer or negative values.
 */
export declare function getSnapshotThresholdFromEnv(env?: NodeJS.ProcessEnv): number | undefined;
/**
 * The snapshot threshold `start()` stamps into a new run's
 * `executionContext`: the client's `WORKFLOW_SNAPSHOT_THRESHOLD` when set,
 * otherwise {@link DEFAULT_QUICKJS_SNAPSHOT_THRESHOLD} for QuickJS runs.
 *
 * Stamping the default (rather than leaving it implicit) matters because
 * the World keys the per-run event limit on the persisted policy: runs with
 * `workflowVm: "quickjs"` and a positive `snapshotThreshold` are exempt
 * from the default event-count ceiling. Without the stamp, a run started
 * with only `WORKFLOW_VM=quickjs` would snapshot at runtime but still be
 * failed at the ceiling.
 *
 * Throws {@link WorkflowRuntimeError} on an invalid env value.
 */
export declare function getSnapshotThresholdForStart(workflowVm: WorkflowVmMode | undefined, env?: NodeJS.ProcessEnv): number | undefined;
/**
 * Resolve the snapshot threshold for a run: the run's stamped
 * `executionContext.snapshotThreshold` (set by the SDK at `start()` when
 * `WORKFLOW_SNAPSHOT_THRESHOLD` is set on the client) wins so a run keeps
 * the policy it started with; otherwise the handler's env var; otherwise
 * {@link DEFAULT_QUICKJS_SNAPSHOT_THRESHOLD}. Only consulted by the QuickJS
 * engine.
 *
 * Throws on an invalid value. The workflow handler uses
 * {@link getSnapshotThresholdForHandler}, which doesn't.
 */
export declare function getSnapshotThreshold(workflowRun: WorkflowRun): number;
/**
 * The snapshot threshold explicitly configured for a run (stamped into its
 * `executionContext` or set via `WORKFLOW_SNAPSHOT_THRESHOLD` on the
 * handler), or `undefined` when the run falls back to
 * {@link DEFAULT_QUICKJS_SNAPSHOT_THRESHOLD}.
 *
 * Throws on an invalid value.
 */
export declare function getConfiguredSnapshotThreshold(workflowRun: WorkflowRun): number | undefined;
/**
 * Whether the run's snapshot threshold was explicitly configured rather
 * than falling back to {@link DEFAULT_QUICKJS_SNAPSHOT_THRESHOLD}. Never
 * throws: an invalid value counts as configured.
 *
 * `start()` stamps the default into QuickJS runs (see
 * {@link getSnapshotThresholdForStart}), so a stamped value equal to the
 * default is treated as unconfigured unless `WORKFLOW_SNAPSHOT_THRESHOLD`
 * is also set on the handler.
 */
export declare function isSnapshotThresholdConfigured(workflowRun: WorkflowRun): boolean;
/**
 * {@link getSnapshotThreshold} for the workflow handler: an invalid value
 * disables snapshotting (with a warning through `onInvalid`) instead of
 * throwing. Snapshotting is an optimization, and a throw here would fail
 * every invocation of every QuickJS run on the deployment into a retry
 * loop over a config typo. `start()` still rejects an invalid client-side
 * value up front.
 */
export declare function getSnapshotThresholdForHandler(workflowRun: WorkflowRun, onInvalid: (message: string) => void): number;
/**
 * Whether `WORKFLOW_SNAPSHOT_ALLOW_UNENCRYPTED` opts the handler into
 * persisting VM snapshots for runs without an encryption key. A snapshot is
 * executable VM state that also holds the run's in-memory data, so by
 * default the runtime only snapshots runs whose World supplies an
 * encryption key (which also authenticates the snapshot on restore).
 */
export declare function isUnencryptedSnapshottingAllowed(env?: NodeJS.ProcessEnv): boolean;
//# sourceMappingURL=vm-mode.d.ts.map