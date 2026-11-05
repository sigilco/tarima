export declare const MAX_QUEUE_DELIVERIES = 48;
/**
 * Effective max queue deliveries. Override via `WORKFLOW_MAX_QUEUE_DELIVERIES`.
 */
export declare function getMaxQueueDeliveries(): number;
/**
 * Default maximum time allowed for the *replay* portion of a single workflow
 * handler invocation (in ms). This budget only covers deterministic-replay
 * and workflow-VM execution between step boundaries. Inline step bodies
 * (`"use step"` functions invoked via `executeStep`) do NOT count against
 * it. Step bodies are bounded separately by the platform's function
 * `maxDuration` (e.g. 800s on Vercel Pro Fluid) and `NO_INLINE_REPLAY_AFTER_MS`.
 *
 * If the non-step ("replay") time within a single invocation exceeds this
 * budget, the handler rejects so the queue can retry. After
 * `REPLAY_TIMEOUT_MAX_RETRIES` exhausted attempts the run is failed with
 * `RUN_ERROR_CODES.REPLAY_TIMEOUT`.
 *
 * Note that on Vercel Hobby (standard functions), the platform `maxDuration`
 * is 60s, well below this budget, so the platform SIGTERM will fire first
 * and the queue will re-deliver until the visibility window expires. With
 * Fluid Compute on Hobby the per-function ceiling rises to 300s, still
 * under the default budget.
 *
 * Override via the `WORKFLOW_REPLAY_TIMEOUT_MS` env var (clamped to
 * `MIN_REPLAY_TIMEOUT_MS`..`MAX_REPLAY_TIMEOUT_MS`).
 */
export declare const REPLAY_TIMEOUT_MS = 240000;
/** Lower bound for the replay-timeout env var override. */
export declare const MIN_REPLAY_TIMEOUT_MS = 30000;
/**
 * Upper bound for the replay-timeout env var override. 780s leaves ≥20s of
 * headroom under Vercel Pro Fluid's 800s function ceiling so the handler
 * can write `run_failed` before SIGTERM.
 */
export declare const MAX_REPLAY_TIMEOUT_MS = 780000;
/**
 * Resolve the effective replay-timeout budget for the current process.
 *
 * Reads `process.env.WORKFLOW_REPLAY_TIMEOUT_MS` lazily so tests and
 * deployments can override per invocation. Invalid / out-of-range values
 * fall back to a safe value (no throw: the env var is an escape hatch,
 * not a hard requirement) and emit a one-time warning so misconfiguration
 * is observable.
 */
export declare function getReplayTimeoutMs(): number;
/**
 * Reset the warn-once cache. Test-only: exported so unit tests can
 * exercise the warn path repeatedly without sharing state.
 *
 * @internal
 */
export declare function _resetReplayTimeoutWarnCacheForTests(): void;
export declare const REPLAY_TIMEOUT_MAX_RETRIES = 3;
/**
 * Effective replay-timeout retry budget. Override via
 * `WORKFLOW_REPLAY_TIMEOUT_MAX_RETRIES`.
 */
export declare function getReplayTimeoutMaxRetries(): number;
/**
 * How many times one spec 9 orchestrator delivery restarts in place after
 * run-ahead stopped it (`RunAheadStopError`): it settles its writer, reloads
 * the log and replays from cold in the same delivery, with run-ahead off for
 * the rest of the delivery. With run-ahead off a second stop cannot occur, so
 * the cap is a backstop: a stop past it hands the message off
 * (`{ timeoutSeconds: 0 }`) instead of restarting again.
 */
export declare const MAX_RUN_AHEAD_RESTARTS = 1;
/**
 * Default maximum number of steps the owned-inline path runs inline (in
 * parallel) per suspension. The rest are queued to background handlers. Each
 * inline step is created lazily (its `step_created` is folded into the
 * `step_started` that `executeStep` sends), so inlining N steps saves N queue
 * round-trips for a `Promise.all`-style fan-out. `1` reproduces the
 * single-inline-step behavior exactly (useful kill-switch).
 *
 * Override via `WORKFLOW_MAX_INLINE_STEPS` (clamped to
 * `MIN_MAX_INLINE_STEPS`..`MAX_MAX_INLINE_STEPS`).
 */
export declare const MAX_INLINE_STEPS = 3;
/** Lower bound for the inline-steps env override (0 = every step is enqueued). */
export declare const MIN_MAX_INLINE_STEPS = 0;
/**
 * Upper bound for the inline-steps env override. Inline bodies run in parallel
 * within one function invocation, so this caps memory/CPU fan-out per handler.
 */
export declare const MAX_MAX_INLINE_STEPS = 16;
/**
 * Resolve the effective max number of inline steps for the current process.
 *
 * Reads `process.env.WORKFLOW_MAX_INLINE_STEPS` lazily so tests and
 * deployments can override per invocation. Invalid / out-of-range values fall
 * back to a safe value (no throw: the env var is an escape hatch) and emit a
 * one-time warning so misconfiguration is observable.
 */
export declare function getMaxInlineSteps(): number;
/**
 * Optional client-side override for the server-supplied per-run event ceiling.
 * When set to a positive integer, the runtime clamps the server's limit *down*
 * to this value (never raises it) so enforcement can be exercised without a
 * server-side change. `undefined` (unset) ⇒ use the server value as-is.
 *
 * Reads `process.env.WORKFLOW_MAX_EVENTS_OVERRIDE` lazily so tests and
 * deployments can override per invocation. Invalid values fall back to unset
 * (no throw: the env var is an escape hatch) and emit a one-time warning.
 */
export declare function getMaxEventsOverride(): number | undefined;
/**
 * Whether the QuickJS engine's baseline-snapshot startup optimization is
 * enabled (default ON). When on, the engine hydrates a VM with the
 * workflow bundle once per function instance, snapshots it, and starts
 * every invocation by restoring the snapshot instead of re-evaluating
 * the bundle, skipping the dominant share of VM startup (measured
 * ~77ms → ~3ms to first suspension for a 1.3MB bundle). Bundles whose
 * module scope consumes randomness, reads the clock, or replaces a
 * serialization intrinsic are detected at hydrate time and
 * automatically fall back to per-invocation fresh evaluation (see
 * prepareBaselineSnapshot). Set WORKFLOW_QUICKJS_BASELINE_SNAPSHOT=0 to
 * disable.
 */
export declare function isQuickJSBaselineSnapshotEnabled(): boolean;
/**
 * Whether the Node.js inline loop retains a suspended workflow VM within one
 * invocation (default ON). When on, a step- or attribute-driven suspension can
 * keep the live VM, event consumer, and hydrated state even with open hooks or
 * waits. The next loop iteration appends newly durable events instead of
 * rebuilding the `vm.Context` and replaying the whole event log. Hook- or
 * wait-only suspensions park the invocation, while replay divergence falls back
 * to the ordinary durable replay path. QuickJS manages its own retained loop.
 *
 * `WORKFLOW_RETAINED_VM=0` (or `false`) is the kill switch: every iteration
 * replays the Node.js engine from scratch in a fresh VM, matching the
 * pre-retention behavior.
 */
export declare function isVmRetentionEnabled(): boolean;
/**
 * Whether an operator has explicitly disabled optimistic start with
 * `WORKFLOW_OPTIMISTIC_INLINE_START=0` / `=false`. Turbo mode starts the first
 * delivery's inline step bodies before their `step_started` commits (and,
 * under {@link isOptimisticBackgroundStartEnabled}, a background step's first
 * delivery starts its body while its out-of-band `step_started` is in
 * flight); this opt-out keeps turbo's other shortcuts and makes those bodies
 * wait for the commit instead. It wins over the background opt-in.
 *
 * Only the opt-out is read. On single-orchestrator runs there is no general
 * optimistic inline start to turn on: a body that runs before its
 * `step_started` commits can run twice if the in-band fence then refuses the
 * start, and only turbo's first delivery is known to have no other
 * orchestrator. `1` / `true` therefore change nothing. Reads the env var
 * lazily.
 */
export declare function isOptimisticInlineStartExplicitlyDisabled(): boolean;
/**
 * Whether a spec 9 background step's plain first delivery starts its body
 * while its out-of-band `step_started` is in flight
 * (`WORKFLOW_OPTIMISTIC_BACKGROUND_START=1` / `=true`). Off by default: the
 * body then runs only once its start committed, as on spec 8, so a step
 * queued before `run.cancel()` is refused before its body runs, and a start
 * the World throttles or refuses as too early runs no body. Turning it on
 * saves the start's round trip before the body, and in exchange such a body
 * can run (its side effects included) when its start is then refused, with
 * its outcome discarded and, for a throttled start, the body run again on
 * the redelivery. A step declared with `maxRetries: 0` and every delivery
 * that reads the log keep the awaited start either way, and an explicit
 * `WORKFLOW_OPTIMISTIC_INLINE_START=0` wins. Reads the env var lazily.
 */
export declare function isOptimisticBackgroundStartEnabled(): boolean;
/**
 * Whether "turbo mode" is enabled. Turbo mode fast-paths the first delivery of
 * a run's first orchestrator message (the message `start()` enqueued, which
 * carries `runInput`, on its first delivery). That delivery:
 *
 * - writes `run_started` without waiting for it, and synthesizes the run
 *   locally from `runInput`;
 * - skips the initial event-log load: the log holds only `run_created`, which
 *   counts as the run's first in-band position, so the in-band fence count is
 *   known without the load's snapshot;
 * - starts inline step bodies before their `step_created` and `step_started`
 *   commit (optimistic inline start), unless
 *   `WORKFLOW_OPTIMISTIC_INLINE_START=0`. It stops doing so for the rest of
 *   the delivery once the run creates a hook or a wait or writes attributes.
 *
 * Every write still lands after `run_started`: in-band writes queue behind it
 * in the delivery's in-band writer, and stream and attribute writes from step
 * bodies wait on the run-ready barrier.
 *
 * Reads `process.env.WORKFLOW_TURBO` lazily. Default **ON**; disabled only by an
 * explicit `'0'` / `'false'` (case-insensitive).
 */
export declare function isTurboEnabled(): boolean;
/** Environment variable that opts a deployment into dynamic workflows. */
export declare const DYNAMIC_WORKFLOWS_ENV = "WORKFLOW_EXPERIMENTAL_DYNAMIC_WORKFLOWS";
/**
 * Whether this deployment executes dynamic workflows (default OFF).
 *
 * Dynamic source runs with the full privileges of the deployment's functions,
 * so a deployment must opt in before it starts a dynamic run, advertises
 * dynamic support in its health check, or executes stored dynamic code on a
 * delivery. Only `1` or `true` (case-insensitive) enables it; any other value
 * leaves it off.
 *
 * Reads `process.env.WORKFLOW_EXPERIMENTAL_DYNAMIC_WORKFLOWS` on every call so
 * the deployment's runtime environment decides, not the build.
 */
export declare function isDynamicWorkflowsEnabled(): boolean;
export declare const REPLAY_DIVERGENCE_MAX_RETRIES = 3;
/**
 * Effective replay-divergence recovery budget. Override via
 * `WORKFLOW_REPLAY_DIVERGENCE_MAX_RETRIES`.
 */
export declare function getReplayDivergenceMaxRetries(): number;
export declare const DEPLOYMENT_MISMATCH_MAX_RETRIES = 3;
/**
 * Effective deployment-mismatch re-route budget. Override via
 * `WORKFLOW_DEPLOYMENT_MISMATCH_MAX_RETRIES`; `0` fails the run on the first
 * misrouted delivery instead of attempting recovery.
 */
export declare function getDeploymentMismatchMaxRetries(): number;
/** Default {@link getRunAheadDepth}. */
export declare const RUN_AHEAD_DEPTH = 10;
/** Upper bound of {@link getRunAheadDepth}. */
export declare const MAX_RUN_AHEAD_DEPTH = 16;
/**
 * How many inline step outcomes the orchestrator runs ahead of
 * (`WORKFLOW_RUN_AHEAD_DEPTH`, default {@link RUN_AHEAD_DEPTH}, clamped to
 * `0`..{@link MAX_RUN_AHEAD_DEPTH}): at most this many steps whose
 * `step_completed`/`step_failed` has not committed yet, past the last write
 * the orchestrator has seen confirmed. `0` disables run-ahead. See
 * `runtime/out-of-band-observation.ts` for when run-ahead applies.
 */
export declare function getRunAheadDepth(): number;
/**
 * Allowance added to the invocation's inline window when deciding whether
 * an open wait can come due while the orchestrator is still deciding. A wait
 * due within the window plus this allowance makes a run-ahead boundary drain
 * instead.
 *
 * It covers clocks that are not this process's (the host that delivers a
 * timer, and an early timer delivery) and the last boundary of a window
 * starting one replay pass after the window nominally closes: seconds at
 * most, so 30s has an order of magnitude to spare.
 *
 * `run.wakeUp()` completes waits regardless of `resumeAt`, but on a
 * single-orchestrator run it does so by naming them on an orchestrator
 * message, and the orchestrator writes `wait_completed` in-band. An open wait
 * is therefore only path-changing through its own timer.
 */
export declare const OPEN_WAIT_CLOCK_SKEW_MS = 30000;
/**
 * Effective {@link OPEN_WAIT_CLOCK_SKEW_MS}
 * (`WORKFLOW_OPEN_WAIT_CLOCK_SKEW_MS`). A finite integer: a large value such
 * as `31536000000` (one year) makes every open wait de-opt run-ahead.
 */
export declare function getOpenWaitClockSkewMs(): number;
/**
 * Ceiling on events per `createBatch` call the orchestrator makes. A World
 * caps a batch by event count and by bytes (world-vercel: 100 events, and a
 * byte budget over frame meta plus inline-bound payloads) and refuses an
 * oversized one whole, so a suspension's creations go out in batches of at
 * most this many, with a margin under both. A step's `step_created` and the
 * `step_started` behind it stay in one batch. A suspension's creation
 * batches on the awaited path are larger
 * ({@link MAX_IN_BAND_CREATION_BATCH_EVENTS}).
 *
 * 16 rather than the World's limit because a smaller batch commits sooner,
 * and the batch's queued branches publish only once it commits. This is the
 * fan-out chunk size the queued-dispatch path was tuned to: on durabench, 16
 * per chunk against 32 moved the queued branches' median `step_started` from
 * ~570 to ~460 ms after `run_started` at 64 branches, and the last branch's
 * first line from 967 to 875 ms, with no first-branch or join regression at
 * 64 or 128 branches. It bounds the speculative creation batch run-ahead
 * sends ahead of a boundary (a larger fan-out commits in chunks on the
 * awaited path) and run-ahead's coalesced write groups.
 */
export declare const MAX_BATCH_EVENTS = 16;
/**
 * Ceiling on events per creation batch on the awaited path (`batchChunks`).
 * The inline steps' creation-bearing starts go first, in the first batch,
 * and the background creations fill it and the batches behind it, at most
 * this many each. It is above `MAX_MAX_INLINE_STEPS`, so the inline starts
 * always fit the first batch by count.
 *
 * Larger than {@link MAX_BATCH_EVENTS} because an in-band writer sends its
 * batches one at a time: each must commit before the next can name its
 * expected count, so a fan-out pays one full round trip per batch, in
 * sequence. On durabench (64 one-step branches on world-vercel) 16 per batch
 * put the 61 background `step_created` in 4 batches landing ~200-250 ms
 * apart, ~1 s after `run_started` for the last one. With 64 they go out in
 * one batch, together with the 3 inline starts.
 *
 * Bounded by world-vercel's batch limit of 100 events, and by bytes through
 * {@link MAX_IN_BAND_CREATION_BATCH_BYTES}.
 */
export declare const MAX_IN_BAND_CREATION_BATCH_EVENTS = 64;
/**
 * Byte ceiling on one creation batch (`batchChunks`), counted as every
 * event's binary payload bytes plus {@link CREATION_EVENT_META_ALLOWANCE_BYTES}.
 * world-vercel refuses a batch whose frame meta plus inline-bound payloads
 * exceed 768 KB, whole, so this stays well under it while counting every
 * payload byte, including the ones the World would store out of line.
 */
export declare const MAX_IN_BAND_CREATION_BATCH_BYTES: number;
/**
 * Bytes a creation batch reserves per event for what is not payload (event
 * type, correlation id, step name, flags) in
 * {@link MAX_IN_BAND_CREATION_BATCH_BYTES}.
 */
export declare const CREATION_EVENT_META_ALLOWANCE_BYTES = 1024;
/**
 * Messages per queue batch request when a spec 9 orchestrator dispatches a
 * fan-out's background steps. The batches go out in parallel, so a wide
 * fan-out is several concurrent requests rather than one request carrying
 * every message, whose latency grows with its message count. Spec 8
 * publishes one batch per creation chunk, concurrently, to the same effect.
 * Each message keeps its own idempotency key, so a batch the delivery's
 * retry sends again is deduplicated.
 */
export declare const STEP_DISPATCH_QUEUE_BATCH_SIZE = 16;
/** A step's `maxRetries` when its function declares none. */
export declare const DEFAULT_STEP_MAX_RETRIES = 3;
//# sourceMappingURL=constants.d.ts.map