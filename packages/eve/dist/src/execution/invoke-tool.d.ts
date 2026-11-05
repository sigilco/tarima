import type { InvokeToolOptions, InvokeToolResult } from "#channel/invoke-tool.js";
import { type CompiledToolBindings } from "#channel/tool-eligibility.js";
import type { CompiledToolDefinition } from "#compiler/manifest.js";
import type { HarnessToolMap } from "#harness/types.js";
import type { RuntimeCompiledArtifactsSource } from "#runtime/compiled-artifacts-source.js";
import type { RuntimeSandboxRegistry } from "#runtime/sandbox/registry.js";
import type { CompiledRuntimeAgentBundle } from "#runtime/sessions/compiled-agent-cache.js";
import { type InvokeToolTraceOrigin } from "#tracing/eve/invoke-tool-span.js";
/** What `invokeTool` needs from the agent: its static tools and sandbox. */
export interface InvokeToolRuntime {
    /** Present in a deployed agent so framework helpers can reach the compiled graph. */
    readonly bundle?: CompiledRuntimeAgentBundle;
    /** Base URL for framework callbacks, such as the page a sign-in lands on. */
    readonly callbackBaseUrl: string;
    readonly compiledArtifactsSource: RuntimeCompiledArtifactsSource;
    /** The root node's compiled tools and source bindings, which decide invocability. */
    readonly manifest: InvokeToolManifest;
    readonly nodeId: string;
    /** The agent's name, for trace policy and `gen_ai.agent.name`. */
    readonly agentName: string;
    /** The channel the call arrived on, for trace policy and span attributes. */
    readonly origin?: InvokeToolTraceOrigin;
    readonly sandboxRegistry: RuntimeSandboxRegistry;
    /** Static tools only: dynamic resolvers never run outside a turn. */
    readonly tools: HarnessToolMap;
}
/** The part of a compiled manifest `invokeTool` reads to decide invocability. */
export interface InvokeToolManifest extends CompiledToolBindings {
    readonly tools: readonly Pick<CompiledToolDefinition, "behavior" | "hasExecute" | "name" | "sourceId">[];
}
/**
 * Runs one tool outside a turn; see `InvokeToolFn` for the contract. A call
 * without a key gets a fresh session id, so nothing it opens is shared with
 * another call. A keyed call derives its session id from the caller and key.
 * Either way the session's authored state is call-scoped: tool sessions keep
 * only their sandbox. An anonymous caller is denied a keyed call: with one
 * shared principal, the key alone would name the session.
 */
export declare function invokeTool(runtime: InvokeToolRuntime, name: string, input: unknown, options: InvokeToolOptions): Promise<InvokeToolResult>;
