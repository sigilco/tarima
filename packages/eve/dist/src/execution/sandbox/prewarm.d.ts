import type { SandboxJson, SandboxPrepareContext, SandboxProviderRuntime } from "#sandbox/provider.js";
import type { SandboxProviderFiles, SandboxProviderResourceFile } from "#shared/sandbox-provider.js";
import { type RuntimeCompiledArtifactsSource, type RuntimeDiskCompiledArtifactsSource } from "#runtime/compiled-artifacts-source.js";
import { type ResolvedAgentGraphBundle } from "#runtime/graph.js";
import type { SandboxPreparedArtifactEntry } from "#shared/sandbox-prepared-artifacts.js";
export interface SandboxPreparedArtifactStore {
    write(input: {
        readonly compileDirectoryPath: string;
        readonly entries: readonly SandboxPreparedArtifactEntry[];
    }): Promise<void>;
}
/**
 * Optional dispatch override that intercepts every provider `prepare()`
 * call. Production code never supplies this; the orchestrator dispatches
 * directly to the provider. Tests inject a recorder to verify which
 * templates the orchestrator emits and what preparation calls flow through
 * them.
 */
type SandboxProviderPrepareDispatch = (input: {
    readonly context: SandboxPrepareContext;
    readonly provider: SandboxProviderRuntime;
}) => Promise<SandboxJson>;
/**
 * Loads the compiled runtime graph for one authored app root and
 * prepares every provider sandbox template required by that graph.
 *
 * Hydrates the module map directly from authored source so callers
 * don't need a pre-existing `module-map.mjs` import in Node's cache.
 * Shared entrypoint for `eve dev` startup, the dev watcher, and the
 * Vercel build hook.
 */
export declare function prewarmAppSandboxes(input: {
    readonly appRoot: string;
    readonly compiledArtifactsSource?: RuntimeCompiledArtifactsSource;
    readonly loadAgentGraph?: (input: Readonly<{
        compiledArtifactsSource: RuntimeDiskCompiledArtifactsSource;
    }>) => Promise<ResolvedAgentGraphBundle>;
    readonly log?: (message: string) => void;
    readonly dispatch?: SandboxProviderPrepareDispatch;
    readonly preparedArtifactStore?: SandboxPreparedArtifactStore;
}): Promise<void>;
/** The compiled workspace and skill files one sandbox template seeds. */
export interface SandboxTemplateResources {
    /** The compiled resource tree's content hash; absent when the agent has none. */
    readonly key?: string;
    /** The compiled resource directory on the host, holding `workspace/` and `skills/`. */
    readonly path?: string;
    readonly skills?: readonly SandboxProviderResourceFile[];
    readonly workspace?: readonly SandboxProviderResourceFile[];
}
/** The context eve passes to a provider's `prepare()` for one template. */
export declare function createSandboxPrepareContext(input: {
    readonly appRoot: string;
    readonly files: SandboxProviderFiles;
    readonly log: (message: string) => void;
    readonly provider: Pick<SandboxProviderRuntime, "prepare" | "providerName">;
    readonly resources: SandboxTemplateResources;
    readonly sourceRevision: string;
    readonly storagePath: string;
}): SandboxPrepareContext;
export {};
