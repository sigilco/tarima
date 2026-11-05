import type { Storage, WorldCapabilities } from '../interfaces.js';
/**
 * Conformance for atomic start Hook admission (see `start-hook.ts` and
 * `WorldCapabilities.atomicStartHook`).
 *
 * What every World that implements it must agree on, whatever it stores the
 * start Hook in:
 *
 * - It declares `capabilities.atomicStartHook`.
 * - An accepted candidate's run is created with the start Hook echoed on
 *   `run.startHook` (with `hookId`, on `run_created`, `runs.get` and
 *   `run_started`), and re-posting either creating write for it returns that
 *   run.
 * - A refused candidate gets `HookConflictError` naming the owner, creates no
 *   run, and keeps getting the same owner on every later attempt, through
 *   either path, even after the token is free.
 * - Of concurrent candidates for one token, exactly one is accepted.
 * - The direct `run_created` and the queued `run_started` of one candidate,
 *   racing, create one run with one `run_created`.
 * - The admission creates the Hook `startHookId(runId)`: resolvable by token
 *   and by id, and resumable, as soon as `run_created` returns, while the run
 *   is still pending; no `hook_created` is written for it, and a
 *   `hook_created` with its id is refused (400).
 * - It follows the ordinary Hook lifecycle: other runs' `createHook()`
 *   conflict naming the owner (and so does the owner's own second one while
 *   it is live); disposal frees the token at once, even with a retention;
 *   the owner's end frees it, unless the retention is still running, in
 *   which case the Hook stays readable, refuses deliveries and holds the
 *   token until then; the owner may create a Hook on the token again after
 *   disposing it.
 * - A forced `createHook()` takes it like any Hook, even before the workflow
 *   opens it: the owner's log gets `hook_disposed{forceClaimedBy}` for
 *   `startHookId(owner)`.
 * - A retention beyond the World's limit is refused with
 *   `START_HOOK_ADMISSION_REJECTED`.
 * - Past the 24h orphan bound, a candidate with no run is refused with
 *   `START_HOOK_ADMISSION_REJECTED` through either copy, and a decided
 *   candidate's `run_created` is too. A staged orphan (an accepted candidate
 *   whose run was never created) holds its token for the World's hold and
 *   releases it after, resolves as not found and takes no resumes, and its
 *   own later copies are then refused naming the run that took the token.
 *
 * Import it from a World's own test file (by relative path, like the other
 * test-support modules) and call it at module level.
 */
export interface AtomicStartHookConformanceOptions {
    /** Describe-block name, usually the World's name. */
    name: string;
    /** The storage under test. Called once per test. */
    storage: () => Pick<Storage, 'events' | 'runs' | 'hooks'>;
    /** The capabilities the World under test declares (`World.capabilities`). */
    capabilities: () => WorldCapabilities | undefined;
    /** A fresh client-minted run id (`wrun_<ulid>`). */
    newRunId: () => string;
    /**
     * A second events storage over the same backing data as the one passed in
     * (another instance on the same data directory or database), so racing
     * writers can come from different instances, as the direct and queued
     * copies of a start do. Omit when the World cannot have two instances.
     */
    secondEvents?: (first: Storage['events']) => Storage['events'];
    /** How many concurrent candidates to race. Defaults to 8. */
    concurrentCandidates?: number;
    /**
     * Moves the clock the World's admission reads (its `Date.now()`) forward,
     * so the 24h orphan bound can be crossed in virtual time. The suite calls
     * it with `0` after each test to restore real time. Omit to skip the
     * orphan-bound cases.
     */
    advanceClock?: (ms: number) => void;
    /**
     * Whether the World compares Hook retention against the clock
     * `advanceClock` moves (its `Date.now()`), so the retention tests cross a
     * retention in virtual time instead of waiting for it. Omit for a World
     * that compares it elsewhere (in SQL); those tests then use a few seconds
     * of real time.
     */
    retentionReadsAdvanceClock?: boolean;
    /**
     * Leaves the state a writer that died after claiming the token but before
     * the candidate was admitted leaves behind: the claim, and no run. No
     * caller was told it was admitted, so its start Hook is not a Hook yet:
     * lookups answer not found and deliveries are refused. For a World whose
     * acceptance is the run itself (world-local writes the claim immediately
     * before the run). Omit where that state cannot exist (a World that claims
     * the token and creates the run in one transaction).
     */
    stageUnacknowledgedClaim?: (runId: string, token: string) => Promise<void>;
    /**
     * How long a staged unacknowledged claim keeps its token before a contender
     * may take it: world-local holds for its claim lock's lease plus margin, in
     * case the writer is stalled rather than dead. Defaults to 24h.
     */
    orphanHoldMs?: number;
    /**
     * Leaves an accepted candidate whose run is not stored yet, for a World
     * that admits in more than one write (the Vercel backend across regions).
     * None of the Worlds in this repository can be in that state (world-local
     * admits with the run record, world-postgres in one transaction), so no
     * fixture provides it here; the Vercel backend's own suite and the e2e
     * lane against it cover the case. Same contract:
     * its start Hook exists and resolves by token, a delivery to it gets a
     * retryable answer (`retryAfter`) rather than not found while the run can
     * still appear, and it holds its token until the 24h bound or a fence.
     */
    stageAcceptedRowlessCandidate?: (runId: string, token: string) => Promise<void>;
}
export declare function atomicStartHookConformance(options: AtomicStartHookConformanceOptions): void;
//# sourceMappingURL=atomic-start-hook-conformance.d.ts.map