import type { CompiledWorkspaceResourceRoot } from "#compiler/manifest.js";
import type { ResolvedSandboxDefinition } from "#runtime/types.js";
/**
 * Resolved sandbox tracked by the runtime-owned registry.
 *
 * The sandbox does not generate model-visible tools automatically. The
 * framework `bash` tool targets it implicitly.
 *
 * `workspaceResourceRoot` carries the byte-free descriptor for the
 * compiled workspace resource tree owned by this graph node. The
 * prewarm orchestrator resolves the descriptor's logical path against
 * the active compiled artifacts source and writes the contents into
 * the sandbox template artifact. Runtime provider `open(...)` never reads these
 * files.
 */
export interface RuntimeRegisteredSandbox {
    readonly definition: ResolvedSandboxDefinition;
    readonly workspaceResourceRoot: CompiledWorkspaceResourceRoot;
    /** Parent-owned sandbox identity used by a child that selects parent.sandbox. */
    readonly inheritance?: {
        readonly definition: ResolvedSandboxDefinition;
        readonly nodeId: string;
        readonly workspaceResourceRoot: CompiledWorkspaceResourceRoot;
    };
}
/** The definition that opens `sandbox`: its owner's for a subagent that shares its parent's sandbox. */
export declare function owningSandboxDefinition(sandbox: RuntimeRegisteredSandbox): ResolvedSandboxDefinition;
/**
 * Runtime-owned registry that exposes the resolved sandbox to the harness
 * startup path.
 *
 * Every agent owns exactly one sandbox, so the registry is just a
 * single record populated from the selected compiled sandbox source.
 * Production always populates it; tests that
 * need a `null` sandbox cast through `as RuntimeSandboxRegistry`.
 */
export interface RuntimeSandboxRegistry {
    readonly sandbox: RuntimeRegisteredSandbox;
}
/**
 * Builds the runtime-owned registry for one selected compiled sandbox.
 */
export declare function createRuntimeSandboxRegistry(input: {
    readonly sandbox: ResolvedSandboxDefinition;
    readonly workspaceResourceRoot: CompiledWorkspaceResourceRoot;
}): RuntimeSandboxRegistry;
