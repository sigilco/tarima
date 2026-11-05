import type { RuntimeDiskCompiledArtifactsSource } from "#runtime/compiled-artifacts-source.js";
/** Serializes whole-generation preparation across dev workers, rechecking artifacts under the lock. */
export declare function ensureDevelopmentSandboxesPrepared(input: {
    readonly compiledArtifactsSource: RuntimeDiskCompiledArtifactsSource;
    readonly nodeId: string;
    readonly providerName: string;
}): Promise<void>;
