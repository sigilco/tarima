import { z } from "#compiled/zod/index.js";
import type { SandboxPreparedArtifact } from "#shared/sandbox-provider.js";
export declare const SANDBOX_PREPARED_ARTIFACTS_KIND = "eve-sandbox-prepared-artifacts";
export declare const SANDBOX_PREPARED_ARTIFACTS_VERSION = 2;
export interface SandboxPreparedArtifactEntry {
    readonly artifact: SandboxPreparedArtifact;
    readonly nodeId: string;
    readonly providerName: string;
}
export interface SandboxPreparedArtifactsManifest {
    readonly entries: readonly SandboxPreparedArtifactEntry[];
    readonly kind: typeof SANDBOX_PREPARED_ARTIFACTS_KIND;
    readonly version: typeof SANDBOX_PREPARED_ARTIFACTS_VERSION;
}
export declare const sandboxPreparedArtifactsManifestSchema: z.ZodType<SandboxPreparedArtifactsManifest>;
export declare function createSandboxPreparedArtifactsManifest(entries: readonly SandboxPreparedArtifactEntry[]): SandboxPreparedArtifactsManifest;
