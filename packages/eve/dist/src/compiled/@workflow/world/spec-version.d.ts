/**
 * Spec version utilities for backward compatibility.
 *
 * Uses a branded type to ensure packages import the version constants
 * from @workflow/world rather than using arbitrary numbers.
 */
declare const SpecVersionBrand: unique symbol;
/**
 * Branded type for spec versions. Must be created via SPEC_VERSION constants.
 * This ensures all packages use the canonical version from @workflow/world.
 */
export type SpecVersion = number & {
    readonly [SpecVersionBrand]: typeof SpecVersionBrand;
};
/**
 * Legacy spec version (pre-event-sourcing). Also used for runs without specVersion.
 * This is the only true legacy version: specVersion 2+ all use the event-sourced model.
 */
export declare const SPEC_VERSION_LEGACY: SpecVersion;
export declare const SPEC_VERSION_SUPPORTS_EVENT_SOURCING: SpecVersion;
export declare const SPEC_VERSION_SUPPORTS_CBOR_QUEUE_TRANSPORT: SpecVersion;
export declare const SPEC_VERSION_SUPPORTS_ATTRIBUTES: SpecVersion;
/**
 * Runs at this spec version or later may contain zstd- or gzip-compressed
 * payloads. Readers older than this version reject the run via
 * `requiresNewerWorld()` instead of failing on individual payloads.
 */
export declare const SPEC_VERSION_SUPPORTS_COMPRESSION: SpecVersion;
/**
 * Runs at this spec version get slot-numbered event ids: `evnt_` followed by a
 * zero-padded decimal position, dense and contiguous from 1 within one run.
 *
 * This exists for Worlds that cannot read a run's scheme off its own storage.
 * `world-local` and `world-postgres` own the counter that mints the ids, so
 * they know per run which scheme it started under. `world-vercel` writes
 * through an API whose allocator has to make that decision on each request,
 * and the spec version stamped on `run_created` is what carries it. A run
 * created before the backend adopted slots stays on ULIDs for its whole life
 * because its stamped version is below this one.
 *
 * Slots are no longer optional for a World: the runtime reads a position out
 * of every event id it loads (`requireEventSlot`) and fails the run if it
 * cannot. That makes this version the lowest one this runtime can serve at
 * all. See `SPEC_VERSION_CURRENT`.
 */
export declare const SPEC_VERSION_SUPPORTS_SLOT_IDENTITY: SpecVersion;
/**
 * Runs at this spec version or later live in a "sealed log": their slot
 * positions are pre-assigned by a per-run sequencer on the World's backend,
 * so concurrent writers never race each other for a position. A position
 * whose writer died is filled ("sealed") by the backend with a `noop` event.
 * What the version gates is the READER contract that makes that safe: a
 * reader at this version knows a `noop` occupies its slot and carries no
 * workflow meaning, and skips it during replay without advancing the
 * deterministic clock (see `EventsConsumer`). A reader below this version
 * would fail to parse the unknown event type, which is exactly what
 * `requiresNewerWorld` exists to catch.
 *
 * Note this is the READER contract only, so a World is spec-7 compliant by
 * construction if it allocates each position at the commit that occupies it:
 * no write can then leave a position empty, so it has no holes to seal and
 * will never emit a `noop`. Pre-assigning positions ahead of the commit is
 * what creates the obligation (see `building-a-world.mdx`), and only a World
 * that does so needs the sealing half.
 */
export declare const SPEC_VERSION_SUPPORTS_SEALED_LOG: SpecVersion;
/**
 * Runs at this spec version or later understand an INVOLUNTARY hook disposal:
 * a `hook_disposed` carrying `forceClaimedBy`, written into the run's log by
 * another run's `createHook({ experimental_force: true })`. A reader at this
 * version rejects the hook's awaiters with `HookForceClaimedError` and settles
 * `getConflict()`; a reader below it treats the row as its own `dispose()`
 * and leaves every `await hook` pending forever — the run is not corrupted,
 * but it is silently stranded. Like the sealed log, this is a READER contract,
 * and the version is what lets a World tell the two readers apart: a World
 * only takes a token from a running victim stamped at or above this version,
 * and answers the forced creation with an ordinary `hook_conflict`
 * (`forceRefusedReason: 'victim-spec-version'`) otherwise. A finished victim
 * has no reader to strand, so a retained token is taken over at any version.
 *
 * The Python SDK stamps its own spec versions below this one, so a Python
 * run's token can never be taken over — its runtime knows nothing of
 * `forceClaimedBy` either.
 */
export declare const SPEC_VERSION_SUPPORTS_HOOK_FORCE_CLAIM: SpecVersion;
/**
 * Runs at this spec version or later follow the single-orchestrator model:
 * one orchestrator invocation per run makes every decision, step and wait
 * events are plain appends to the log (a World keeps no step or wait state it
 * checks writes against), and the orchestrator's own writes are fenced.
 *
 * What changes for a reader and a writer:
 *
 * - Every write request says whether the run's orchestrator made it
 *   (`CreateEventParams.inBand`). An in-band write carries the orchestrator's
 *   count of in-band positions (`expectedSeqInBand`), taken from the
 *   `snapshot` its log load returned. The World refuses an in-band write
 *   whose count is stale with
 *   `InBandSupersededError`, which makes at most one orchestrator a writer
 *   even when two invocations of it run at once. A World that creates
 *   spec 9 runs implements this fence (`WorldCapabilities.inBandFence`).
 * - `step_created` records how the step executes (`eventData.inline`) and
 *   which queue message's invocation created it (`creatorMessageId`). Step
 *   events carry `stepName`, and `step_started` carries `attempt`.
 * - Replay treats any event for an entity after its terminal event as inert.
 *
 * Structural: positions are counted against an in-band head, and step state
 * is folded from the log instead of read from a row, so a run can only be
 * moved across this version before anything past `run_created` exists.
 *
 * It requires the sealed log: the fence counts positions the World's
 * sequencer allocates, so it builds on {@link SPEC_VERSION_SUPPORTS_SEALED_LOG}.
 */
export declare const SPEC_VERSION_SINGLE_ORCHESTRATOR: SpecVersion;
/**
 * Current spec version: event-sourced architecture with native attributes,
 * compressed payloads, slot-numbered event ids, sealed-log sequencing, and
 * involuntary hook disposal.
 *
 * This is the version a World stamps on the runs it creates by default (see
 * {@link mintedSpecVersion}). The single-orchestrator model,
 * {@link SPEC_VERSION_SINGLE_ORCHESTRATOR}, sits one version above it and is
 * opt-in, so this stays below {@link SPEC_VERSION_MAX_SUPPORTED}: the runtime
 * reads and drives runs of both. The lowest version this runtime accepts from
 * a World is lower still: see `assertWorldSupportsRuntimeProtocol` in
 * `@workflow/core`, which floors at {@link SPEC_VERSION_SUPPORTS_SLOT_IDENTITY}.
 *
 * A World declares `mintedSpecVersion()` rather than this constant or a
 * literal, so a bump moves the declaration with the package. Pinning a
 * literal would leave the adapter one version behind the next bump.
 *
 * Bumping this does not touch runs already created: their stamped version is
 * persisted, every version test in the runtime is `>=`, and a World resolves a
 * run's identity scheme from what is stored rather than from this constant.
 */
export declare const SPEC_VERSION_CURRENT: SpecVersion;
/**
 * The spec version {@link mintedSpecVersion} returns when no setting changes
 * it: {@link SPEC_VERSION_CURRENT}. Spec 9 runs are created only on request
 * (`WORKFLOW_SPEC_VERSION=9`), and only by a World that declares the in-band
 * fence.
 */
export declare const SPEC_VERSION_DEFAULT_MINTED: SpecVersion;
/**
 * Environment variable that selects the spec version new runs are created
 * with; see {@link mintedSpecVersion}.
 */
export declare const SPEC_VERSION_ENV_VAR = "WORKFLOW_SPEC_VERSION";
/**
 * Environment variable that opts new runs out of the sealed log: `0` or
 * `false` creates runs at {@link SPEC_VERSION_SUPPORTS_SLOT_IDENTITY}, as it
 * did before {@link SPEC_VERSION_ENV_VAR} existed. Read only while
 * {@link SPEC_VERSION_ENV_VAR} is unset.
 *
 * @deprecated Set {@link SPEC_VERSION_ENV_VAR} instead.
 */
export declare const SEALED_LOG_ENV_VAR = "WORKFLOW_SEALED_LOG";
/** What a World can do that decides which spec versions it may mint. */
export interface MintedSpecVersionOptions {
    /**
     * The World implements the in-band writer fence
     * (`WorldCapabilities.inBandFence`). Spec 9 runs need it, so without it
     * {@link mintedSpecVersion} never returns
     * {@link SPEC_VERSION_SINGLE_ORCHESTRATOR}.
     */
    inBandFence?: boolean;
}
/**
 * The spec version a World should stamp on the runs it creates.
 *
 * | `WORKFLOW_SPEC_VERSION` | `inBandFence` | returns |
 * |---|---|---|
 * | unset | any | {@link SPEC_VERSION_DEFAULT_MINTED} (8), or {@link SPEC_VERSION_SUPPORTS_SLOT_IDENTITY} (6) with `WORKFLOW_SEALED_LOG=0` |
 * | `9` | `true` | {@link SPEC_VERSION_SINGLE_ORCHESTRATOR} |
 * | `9` | not `true` | the default, with a warning once per process |
 * | `6` to `8` | any | that version |
 * | anything else | any | the default, with a warning once per process |
 *
 * Values are trimmed. When both variables are set, `WORKFLOW_SPEC_VERSION`
 * wins and a warning is logged once.
 *
 * A call with no options never returns 9. A World written to an earlier
 * "Building a World" guide, which declares `specVersion: mintedSpecVersion()`,
 * keeps creating spec 8 runs whatever the environment says, and only a World
 * that implements the fence and passes `{ inBandFence: true }` can create
 * spec 9 runs.
 *
 * The setting gates minting only. The runtime drives runs of every version
 * from {@link SPEC_VERSION_SUPPORTS_SLOT_IDENTITY} to
 * {@link SPEC_VERSION_MAX_SUPPORTED}: spec 9 runs with the single
 * orchestrator, kept to one writer by the World's in-band fence, and earlier
 * runs with the spec 8 orchestrator, which needs no fence. Everything that
 * reads, routes or writes to an existing run follows the version stamped on
 * that run, so changing the setting only affects new runs. (A backend may
 * raise a running run across {@link CAPABILITY_ONLY_SPEC_VERSIONS}, never
 * across a structural version such as
 * {@link SPEC_VERSION_SINGLE_ORCHESTRATOR}, so a run never changes
 * orchestrator.)
 *
 * A function rather than a constant so a World reads the settings where it is
 * created.
 */
export declare function mintedSpecVersion(env?: Record<string, string | undefined>, options?: MintedSpecVersionOptions): SpecVersion;
/**
 * The highest spec version this SDK can read.
 *
 * Kept distinct from `SPEC_VERSION_CURRENT` even when they coincide. They
 * answer different questions, "what do we write?" versus "what can we still
 * read?", and they come apart in exactly the release order a spec bump
 * follows: a reader that can already handle the next version raises this
 * ceiling first, and stamping follows only once the version is safe to mint
 * everywhere.
 */
export declare const SPEC_VERSION_MAX_SUPPORTED: SpecVersion;
/**
 * Spec versions whose only effect is to switch on capabilities of a run's
 * reader and writer, which is the runtime executing it. A backend may raise
 * a running run across these (to its executor's attested version, see
 * `executorSpecVersion` on `run_started`), because nothing already in the
 * run's log changes meaning.
 *
 * Every other version is STRUCTURAL: it changes how the log is laid out or
 * read (event sourcing itself, slot-numbered event ids, sealed-log
 * sequencing), so a run may only be moved across it before any event past
 * `run_created` exists. That includes versions not listed here yet: an
 * unclassified future version is structural by default, and adding a
 * version constant without classifying it fails this package's tests.
 */
export declare const CAPABILITY_ONLY_SPEC_VERSIONS: ReadonlySet<number>;
/** The structural spec versions; see {@link CAPABILITY_ONLY_SPEC_VERSIONS}. */
export declare const STRUCTURAL_SPEC_VERSIONS: ReadonlySet<number>;
/**
 * Whether moving a run from spec version `from` up to `to` crosses a
 * structural version, and so is only allowed while the run's log holds
 * nothing but `run_created`. See {@link CAPABILITY_ONLY_SPEC_VERSIONS}.
 */
export declare function crossesStructuralSpecVersion(from: number, to: number): boolean;
/**
 * Check if a spec version is legacy (<= SPEC_VERSION_LEGACY or undefined).
 * Legacy runs require different handling - they use direct entity mutation
 * instead of the event-sourced model.
 *
 * Checks against SPEC_VERSION_LEGACY (1), not SPEC_VERSION_CURRENT, so that
 * intermediate versions (e.g. 2) are not incorrectly treated as legacy when
 * SPEC_VERSION_CURRENT is bumped.
 *
 * @param v - The spec version number, or undefined/null for legacy runs
 * @returns true if the run is a legacy run
 */
export declare function isLegacySpecVersion(v: number | undefined | null): boolean;
/**
 * Check if a spec version requires a newer world (> SPEC_VERSION_MAX_SUPPORTED).
 * This happens when a run was created by a newer SDK version.
 *
 * @param v - The spec version number, or undefined/null for legacy runs
 * @returns true if the run requires a newer world version
 */
export declare function requiresNewerWorld(v: number | undefined | null): boolean;
export {};
//# sourceMappingURL=spec-version.d.ts.map