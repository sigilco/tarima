import type { VercelCreateOptions, VercelModule, VercelSandbox } from "#execution/sandbox/bindings/vercel-sdk-types.js";
/** Deletes the sandbox with this name, if there is one. */
export declare function deleteNamedVercelSandbox(input: {
    readonly createOptions: VercelCreateOptions;
    readonly sandboxModule: VercelModule;
    readonly sandboxName: string;
    readonly signal?: AbortSignal;
}): Promise<void>;
/** Deletes a sandbox that can no longer resume, without stopping it first. */
export declare function deleteUnusableVercelSandbox(input: {
    readonly createOptions: VercelCreateOptions;
    readonly sandboxModule: VercelModule;
    readonly sandboxName: string;
}): Promise<void>;
export declare function stopVercelSandbox(sandbox: VercelSandbox): Promise<void>;
