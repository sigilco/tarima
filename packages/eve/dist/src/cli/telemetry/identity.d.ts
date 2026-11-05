export type EveCliTelemetryIdentity = {
    readonly installationId: string;
    readonly projectSalt: string;
};
export declare function createEveTelemetryIdentity(): EveCliTelemetryIdentity;
export declare function isEphemeralEveTelemetryEnvironment(): boolean;
export declare function hashEveTelemetryProject(identity: EveCliTelemetryIdentity, value: string): string;
export declare function resolveEveTelemetryProjectId(input: {
    readonly cwd?: string;
    readonly repositoryUrl?: string;
    readonly getGitRemote?: (cwd: string) => Promise<string | undefined>;
    readonly identity: EveCliTelemetryIdentity;
}): Promise<string>;
