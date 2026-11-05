/**
 * Shared shape for finalizing a step whose arguments failed to serialize
 * (used by both the node:vm suspension handler and the QuickJS entrypoint).
 *
 * The world requires a `step_created` before any terminal step event, and
 * the step's real input is precisely what refused to serialize, so the
 * finalization writes a placeholder input. The marker string makes the
 * placeholder distinguishable from a genuine zero-argument step in
 * `workflow inspect steps` and the observability UI: a reader sees
 * "input unavailable" instead of "no arguments".
 */
export declare const UNSERIALIZABLE_STEP_INPUT_MARKER = "[input unavailable: step argument serialization failed]";
/**
 * The placeholder value serialized into the failed step's `step_created`
 * input. Matches the `{ args, closureVars, thisVal }` triple
 * `dehydrateStepArguments` / the QuickJS bootstrap produce for real steps,
 * so every consumer hydrates it uniformly, plus the structural flag the
 * step executor checks before running user code (see
 * {@link isUnserializableStepInputPlaceholder}).
 */
export declare function unserializableStepInputPlaceholder(): Record<string, unknown>;
/**
 * Whether a hydrated step input is the finalization placeholder.
 *
 * Finalization writes `step_created` (placeholder) and `step_failed` as two
 * separate durable writes; a crash or transient failure between them leaves
 * a pending step whose stored input is the placeholder. Redelivery then
 * dispatches that step through normal crash recovery: the executor calls
 * this before running user code and completes the intended failure (a fatal
 * SerializationError → `step_failed`) instead of silently invoking the step
 * body with placeholder arguments.
 */
export declare function isUnserializableStepInputPlaceholder(hydratedInput: unknown): boolean;
//# sourceMappingURL=unserializable-step.d.ts.map