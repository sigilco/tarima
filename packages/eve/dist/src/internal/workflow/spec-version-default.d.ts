/** Spec version eve opts new Workflow runs into: one orchestrator per run. */
export declare const EVE_WORKFLOW_SPEC_VERSION = 9;
/**
 * Opts new Workflow runs into {@link EVE_WORKFLOW_SPEC_VERSION} unless the
 * operator chose a version. Worlds read the setting when `createWorld()`
 * runs, so this must be applied before every World eve constructs. A World
 * without the in-band writer fence ignores it and keeps creating spec 8 runs.
 */
export declare function applyWorkflowSpecVersionDefault(env?: Record<string, string | undefined>): void;
