export declare const EVE_DEVELOPMENT_SANDBOX_RUN_ID_ENV = "EVE_DEVELOPMENT_SANDBOX_RUN_ID";
export declare const EVE_DEVELOPMENT_SANDBOX_RUN_ID_TAG = "devRunId";
export declare function createDevelopmentSandboxRunId(): string;
export declare function getDevelopmentSandboxRunId(): string | undefined;
export declare function withDevelopmentSandboxTags(tags: Readonly<Record<string, string>> | undefined): Readonly<Record<string, string>> | undefined;
