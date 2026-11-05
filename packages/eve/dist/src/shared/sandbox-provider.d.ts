export interface SandboxDeleteOptions {
    readonly signal?: AbortSignal;
}
export interface SandboxProviderResourceFile {
    readonly content: string | Uint8Array;
    readonly relativePath: string;
}
export type SandboxPreparedArtifact = null | boolean | number | string | readonly SandboxPreparedArtifact[] | {
    readonly [key: string]: SandboxPreparedArtifact;
};
export declare function isSandboxPreparedArtifact(value: unknown): value is SandboxPreparedArtifact;
export interface SandboxProviderFiles {
    list(): Promise<readonly string[]>;
    read(path: string): Promise<Uint8Array>;
    readText(path: string): Promise<string>;
}
