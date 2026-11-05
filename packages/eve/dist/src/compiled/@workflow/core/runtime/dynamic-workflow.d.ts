/**
 * Dynamic workflow source: starting a run from a workflow function that is
 * not in the deployment's build-time manifest.
 *
 * The normal path compiles workflow functions at build time — the SWC plugin
 * rewrites `"use workflow"` bodies, the builder bundles them, and `start()`
 * names one by the `workflowId` the transform stamped on it. Dynamic source
 * covers orchestration the application assembles after the deployment exists,
 * over a fixed catalog of deployed steps.
 *
 * This module owns the compile half of that: validating the source, deriving
 * a stable workflow id from it, and generating the VM code that registers it.
 * The generated code — not the source — is what gets stored with the run and
 * replayed, so the module is also the format boundary: a run replays byte-for-byte
 * the code it started on, and changing the generator here does not retroactively
 * change what an in-flight run executes.
 *
 * Deliberately not a security sandbox. The workflow VM enforces determinism,
 * not isolation from malicious JavaScript, so dynamic source is trusted
 * application code with the full privileges of the deployment's functions.
 * The `steps` allowlist below is a convenience that keeps ordinary code from
 * reaching a step it was not given; it is not a capability boundary against
 * code that is actively trying to escape one. Deployments opt in with
 * `WORKFLOW_EXPERIMENTAL_DYNAMIC_WORKFLOWS` before they start or execute it.
 */
import { WorkflowRuntimeError } from '#compiled/@workflow/errors/index.js';
import type { StartOptions } from './start.js';
/**
 * The error `start()` throws when it refuses a dynamic start before anything
 * is written: invalid source or options, the opt-in, the target deployment,
 * the World's capability, or its execution-context limit.
 *
 * Each refusal is deterministic, so retrying the same `start()` fails the same
 * way. `fatal` is what tells the step executor so when `start()` runs inside
 * a step: without it the step spends its retry budget on a refusal, then
 * replaces the message with its retry-exhaustion wrapper. The type and message
 * are otherwise a plain `WorkflowRuntimeError`. See `FatalError.is()`.
 */
export declare function dynamicStartRefusal(message: string, options?: ErrorOptions): WorkflowRuntimeError & {
    fatal: true;
};
/**
 * The refusal for an error thrown by a World's `validateRunExecutionContext`;
 * the World contract makes that throw the start's refusal, whatever it threw.
 *
 * A fresh error carrying the World's message, with the original as `cause`,
 * rather than a `fatal` flag set on the World's own object: that object may be
 * frozen, shared across calls, or not an `Error` at all.
 */
export declare function dynamicStartRefusalFrom(error: unknown): WorkflowRuntimeError & {
    fatal: true;
};
/**
 * A step exposed to dynamic source.
 *
 * Either an imported step function, or an explicit `{ stepId }` for a step
 * whose function is not importable from the calling context.
 *
 * The function arm is deliberately typed as "any function" rather than as
 * something carrying `stepId`: the build-time transform stamps `.stepId` on
 * step functions at *runtime*, and nothing adds it to their declared type. A
 * type that demanded it would reject the documented call — `steps: { fetchUser,
 * sendEmail }` with real imports — and only accept the escape hatch. The
 * runtime check in `resolveStepId` is the real gate, and it fails with a
 * message naming the alias when a value turns out to carry no step id.
 */
export type DynamicWorkflowStepReference = {
    readonly stepId: string;
} | ((...args: any[]) => unknown);
export interface DynamicWorkflowOptions {
    /**
     * Already-registered step functions to expose to the source, keyed by the
     * alias it calls them under (`steps.<alias>(...)`).
     *
     * Each value is either an imported step function — the SDK transform stamps
     * a `.stepId` on it — or an explicit `{ stepId }` reference for a step whose
     * function is not importable from the calling context.
     *
     * There is no way to register a *new* step from dynamic source: only the
     * orchestration is dynamic, and every step it can reach was deployed with
     * the app.
     */
    steps: Record<string, DynamicWorkflowStepReference>;
    /**
     * Name of the async workflow function in the source. Defaults to
     * `"workflow"`.
     */
    exportName?: string;
}
/** `start()` options for the dynamic-source overload. */
export type DynamicStartOptions = StartOptions & {
    experimental_dynamic: DynamicWorkflowOptions;
};
/**
 * Plaintext metadata recorded on `executionContext.dynamicWorkflow`.
 *
 * Deliberately small and non-sensitive: it has to fit the execution-context
 * budget (2 KB on `world-vercel`) and it is readable without decrypting
 * anything, which is what lets observability show that a run is dynamic —
 * and which steps it was allowed to call — while the code itself stays
 * encrypted behind the run's ref.
 */
export interface DynamicWorkflowMetadata {
    version: 1;
    /** SHA-256 over the source and its step bindings. */
    sourceHash: string;
    /** Name of the workflow function inside the source. */
    exportName: string;
    /** Alias → step id map the source was compiled against. */
    steps: Record<string, string>;
}
/**
 * Maximum size of the *source* `start()` accepts.
 *
 * This is a product limit rather than a storage one — generated
 * orchestration functions are small, and a caller handing us a megabyte of
 * "workflow" has almost certainly made a mistake worth surfacing at the call
 * site. The storage layer's own cap is far higher; see the Dynamic Workflows
 * docs.
 */
export declare const DYNAMIC_WORKFLOW_SOURCE_MAX_BYTES: number;
/**
 * Largest serialized code payload sent inline on `run_created`.
 *
 * Above this the code is uploaded separately and referenced, because it stops
 * fitting comfortably in the creating write's metadata budget (the
 * `world-vercel` backend caps the inline field at 32 KB). Set below that cap
 * so a compression ratio worse than expected does not push a run over it.
 *
 * Almost every real definition is under this: 24 KB of *compressed,
 * encrypted* bytes is a lot of JavaScript.
 */
export declare const DYNAMIC_WORKFLOW_CODE_INLINE_MAX_BYTES: number;
/**
 * The SDK's limit on `exportName`. The name becomes the last segment of the
 * generated workflow id, which is also the queue topic name, and it counts
 * against the run's execution-context budget. Queues cap topic names too
 * (Vercel's at 256 characters, prefix included), so a long name buys nothing
 * and fails late.
 */
export declare const DYNAMIC_WORKFLOW_EXPORT_NAME_MAX_LENGTH = 64;
export interface CompiledDynamicWorkflow {
    /** Generated workflow id, also the run's `workflowName`. */
    workflowName: string;
    /** Workflow VM code to store with the run and replay from. */
    workflowCode: string;
    /** Plaintext metadata for `executionContext.dynamicWorkflow`. */
    metadata: DynamicWorkflowMetadata;
}
/**
 * The workflow id a dynamic definition registers under.
 *
 * Half the digest. Long enough that a collision is not a practical concern and
 * short enough to keep queue topic names and observability rows readable.
 * Delivery recomputes it from a run's `dynamicWorkflow` marker and refuses a
 * run whose `workflowName` does not match, so a marker cannot turn a static
 * workflow's run into one that executes stored code.
 */
export declare function dynamicWorkflowName(metadata: Pick<DynamicWorkflowMetadata, 'sourceHash' | 'exportName'>): string;
/**
 * Validate dynamic source and generate the workflow VM code for it.
 *
 * The workflow id is derived from the source and its step bindings rather
 * than accepted from the caller. Two consequences, both intentional: the same
 * definition always lands on the same queue topic and groups together in
 * observability, and a caller cannot claim a static workflow's id — or
 * another definition's — for arbitrary code.
 */
export declare function compileDynamicWorkflow(source: string, options: DynamicWorkflowOptions): Promise<CompiledDynamicWorkflow>;
/**
 * Read the dynamic-workflow marker off a run's `executionContext`.
 *
 * The runtime uses this to decide whether a run replays from the deployment's
 * bundle or from its own stored code, so it validates the shape rather than
 * trusting it: `executionContext` is client-supplied and passes through the
 * backend unchecked.
 *
 * Returns undefined for every static run, which is the overwhelming majority
 * — this is on the hot path of each delivery.
 */
export declare function readDynamicWorkflowMetadata(executionContext: unknown): DynamicWorkflowMetadata | undefined;
//# sourceMappingURL=dynamic-workflow.d.ts.map