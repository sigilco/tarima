export interface DevelopmentGenerationMetadata {
    readonly runtimeAppRoot: string;
}
export declare function resolveDevelopmentRuntimeArtifactsSnapshotsDirectory(appRoot: string): string;
export declare function listDevelopmentGenerationIds(appRoot: string): Promise<string[]>;
export declare function readDevelopmentGenerationMetadata(appRoot: string, generationId: string): Promise<{
    readonly kind: "ready";
    readonly metadata: DevelopmentGenerationMetadata;
} | {
    readonly kind: "missing";
} | {
    readonly kind: "invalid";
}>;
