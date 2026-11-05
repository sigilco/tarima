import type { VercelCreateOptions } from "#execution/sandbox/bindings/vercel-sdk-types.js";
export declare function resolveVercelSandboxTags(userTags: VercelCreateOptions["tags"], eveTags: Readonly<Record<string, string>> | undefined): Record<string, string> | undefined;
export declare function ensureVercelSandboxTags(sandbox: {
    readonly tags?: Record<string, string>;
    update(options: {
        tags: Record<string, string>;
    }): Promise<unknown>;
}, tags: Record<string, string> | undefined): Promise<void>;
export declare function errorMessage(error: unknown): string;
