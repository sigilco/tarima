import type { VercelCreateOptions, VercelModule, VercelSandbox } from "#execution/sandbox/bindings/vercel-sdk-types.js";
export declare function getNamedVercelSandbox(input: {
    readonly createOptions: VercelCreateOptions;
    readonly sandboxModule: VercelModule;
    readonly sandboxName: string;
}): Promise<VercelSandbox | null>;
/** Whether a snapshot exists and finished, so a sandbox can still start from it. */
export declare function isVercelSnapshotCreated(input: {
    readonly createOptions: VercelCreateOptions;
    readonly sandboxModule: VercelModule;
    readonly snapshotId: string;
}): Promise<boolean>;
