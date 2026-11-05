import { type CompiledModuleMap } from "#compiler/module-map.js";
import type { RuntimeDiskCompiledArtifactsSource } from "#runtime/compiled-artifacts-source.js";
/** Hydrates the compiled module map from the manifest’s authored bindings. */
export declare function loadCompiledModuleMapFromAuthoredSource(input: {
    readonly compiledArtifactsSource: RuntimeDiskCompiledArtifactsSource;
    /** Current location of a built application deployed with its source and dependencies. */
    readonly authoredAppRoot?: string;
}): Promise<CompiledModuleMap>;
