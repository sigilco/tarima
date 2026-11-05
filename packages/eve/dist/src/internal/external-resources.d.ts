import type { CompiledAgentManifest } from "#compiler/manifest.js";
import { type ExternalResourcesSnapshot } from "#internal/external-resources-snapshot.js";
import { type JsonObject } from "#shared/json.js";
export declare function buildExternalResourcesSnapshot(input: {
    readonly generatorVersion: string;
    readonly manifest: CompiledAgentManifest;
    readonly publicRoutePrefix?: string;
}): ExternalResourcesSnapshot;
export declare function emitConnectManifest(input: {
    readonly appRoot: string;
    readonly generatorVersion: string;
    readonly manifest: CompiledAgentManifest;
    readonly outputDirectory: string;
    readonly publicRoutePrefix?: string;
}): Promise<void>;
export declare function createConnectManifest(input: {
    readonly appRoot: string;
    readonly snapshot: ExternalResourcesSnapshot;
}): Promise<JsonObject | undefined>;
