import type { RuntimeCompiledArtifactsSource } from "#runtime/compiled-artifacts-source.js";
import { type SandboxPreparedArtifactEntry } from "#shared/sandbox-prepared-artifacts.js";
import type { SandboxPreparedArtifact } from "#shared/sandbox-provider.js";
export declare function writeSandboxPreparedArtifactsManifest(input: {
    readonly compileDirectoryPath: string;
    readonly entries: readonly SandboxPreparedArtifactEntry[];
}): Promise<void>;
export declare function loadSandboxPreparedArtifact(input: {
    readonly compiledArtifactsSource: RuntimeCompiledArtifactsSource;
    readonly nodeId: string;
    readonly providerName: string;
}): Promise<SandboxPreparedArtifact | undefined>;
