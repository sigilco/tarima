import type { NitroArtifactsConfig } from "#internal/nitro/routes/runtime-artifacts.js";
export declare function handleConnectionEventRequest(input: {
    artifactsConfig: NitroArtifactsConfig;
    connectionName: string;
}, request: Request): Promise<Response>;
