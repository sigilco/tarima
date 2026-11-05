import { type SandboxProviderImplementation } from "#public/sandbox/provider.js";
import type { VercelSandboxRuntimeOptions } from "#public/sandbox/vercel-sandbox.js";
import type { VercelSandboxSession } from "#public/sandbox/vercel.js";
import { type CreateVercelSandbox } from "#execution/sandbox/bindings/vercel-create-sdk.js";
import type { VercelCreateOptions, VercelModule } from "#execution/sandbox/bindings/vercel-sdk-types.js";
export type VercelSandboxPreparedArtifact = {
    readonly snapshotId?: string;
};
export type VercelSandboxSessionState = {
    readonly sandboxName: string;
    readonly version: 3;
};
/** Capabilities a Vercel connection adds to the session. */
export type VercelSandboxExtensions = Pick<VercelSandboxSession, "name" | "setNetworkPolicy">;
interface CreateVercelSandboxInput {
    readonly createSandbox?: CreateVercelSandbox;
    readonly createOptions?: VercelCreateOptions;
    readonly loadSandboxModule?: () => Promise<VercelModule>;
}
export declare function createVercelSandbox(input?: CreateVercelSandboxInput): SandboxProviderImplementation<VercelSandboxRuntimeOptions, VercelSandboxPreparedArtifact, VercelSandboxSessionState, VercelSandboxExtensions>;
export {};
