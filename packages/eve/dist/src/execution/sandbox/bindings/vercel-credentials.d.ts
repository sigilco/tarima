import type { VercelCreateOptions } from "#execution/sandbox/bindings/vercel-sdk-types.js";
export declare function getVercelSandboxFetch(createOptions: VercelCreateOptions): typeof globalThis.fetch;
export declare function getVercelSandboxCredentials(createOptions: VercelCreateOptions): Promise<VercelSandboxCredentials>;
/** Credentials when eve can resolve them; otherwise `{}` so the SDK falls back to its own resolution. */
export declare function resolveVercelSandboxCredentials(createOptions: VercelCreateOptions): Promise<VercelSandboxCredentials | Record<string, never>>;
export interface VercelSandboxCredentials {
    readonly projectId: string;
    readonly teamId: string;
    readonly token: string;
}
