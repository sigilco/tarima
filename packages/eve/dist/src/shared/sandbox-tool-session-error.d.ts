/** Raised when a keyed tool session opens a sandbox on a provider that cannot keep it. */
export declare class ToolSessionSandboxUnsupportedError extends Error {
    constructor(providerName: string);
}
