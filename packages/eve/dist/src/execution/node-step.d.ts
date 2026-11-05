import type { Runtime, SessionCapabilities } from "#channel/types.js";
import type { ExecutionInstrumentation } from "#instrumentation/runtime.js";
import type { HandleEventFn, HarnessToolMap, StepFn } from "#harness/types.js";
import type { RuntimeIdentity } from "#protocol/session-events/families/session.js";
import { type RuntimeModelResolutionScope } from "#runtime/agent/resolve-model.js";
import type { RuntimeCompiledArtifactsSource } from "#runtime/compiled-artifacts-source.js";
import type { ResolvedRuntimeAgentNode } from "#runtime/graph.js";
import type { KernelConfig } from "#harness/types.js";
/**
 * Factory that creates a {@link Runtime} for the given compiled
 * artifacts source and optional node id. Matches the signature of
 * `createWorkflowRuntime`, so callers pass the constructor directly —
 * no wrapper needed.
 */
type CreateRuntime = (config: {
    readonly compiledArtifactsSource: RuntimeCompiledArtifactsSource;
    readonly nodeId?: string;
}) => Runtime;
/**
 * Input for building a harness step for one resolved runtime node.
 */
interface CreateExecutionNodeStepInput {
    readonly steeringSignal?: AbortSignal;
    /** Cancellation signal forwarded to the kernel. */
    readonly abortSignal?: AbortSignal;
    /**
     * Session-level capabilities propagated from the runtime, so
     * capability-gated behavior tracks the current run.
     */
    readonly capabilities?: SessionCapabilities;
    /** Runs only a context clear and returns to the parked session. */
    readonly clearOnly?: boolean;
    /** Runs only a forced context compaction and returns to the parked session. */
    readonly compactOnly?: boolean;
    readonly controlDelivery?: KernelConfig["controlDelivery"];
    /**
     * Runtime constructor used by the subagent tool executor to start
     * delegated child runs on the same workflow runtime as the parent.
     */
    readonly createRuntime: CreateRuntime;
    readonly handleEvent?: HandleEventFn;
    readonly signInCompletions?: KernelConfig["signInCompletions"];
    readonly typedAnswers?: KernelConfig["typedAnswers"];
    readonly instrumentation: ExecutionInstrumentation | undefined;
    readonly setAttributes?: KernelConfig["setAttributes"];
    readonly modelResolutionScope: RuntimeModelResolutionScope;
    readonly node: ResolvedRuntimeAgentNode;
    readonly sessionUsageLimit?: KernelConfig["sessionUsageLimit"];
}
/**
 * Builds a harness step for one resolved runtime node using the execution-owned
 * tool, sandbox, and subagent wiring.
 */
export declare function createExecutionNodeStep(input: CreateExecutionNodeStepInput): StepFn;
/**
 * Builds a {@link RuntimeIdentity} from the resolved runtime agent node
 * and the current eve package installation.
 */
export declare function buildRuntimeIdentity(node: ResolvedRuntimeAgentNode): RuntimeIdentity;
/**
 * Resolves unified {@link HarnessToolDefinition}s from the node's registries.
 *
 * For authored tools: copies all lifecycle fields from the resolved definition.
 * Prepared workflow-backed tools share the workflow-tool harness path.
 * Tools without `execute` (provider-managed) get entries with schema but no execute.
 */
export declare function createNodeHarnessTools(input: {
    readonly node: ResolvedRuntimeAgentNode;
}): HarnessToolMap;
export {};
