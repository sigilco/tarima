import type { DockerSandboxEnvironmentOptions } from "#public/sandbox/docker-sandbox.js";
import type { SandboxSession } from "#public/sandbox/index.js";
import { type SandboxProvider } from "#public/sandbox/provider.js";
import type { VercelSandboxCreateOptions } from "#public/sandbox/vercel-sandbox.js";
import type { SandboxNetworkOptions, SandboxNetworkPolicy } from "#shared/sandbox-network-policy.js";
export interface DefaultSandboxEnvironmentOptions {
    readonly docker?: DockerSandboxEnvironmentOptions;
    readonly justBash?: {
        readonly autoInstall?: boolean;
        readonly prepare?: (sandbox: SandboxSession) => Promise<void> | void;
    };
    readonly prepare?: (sandbox: SandboxSession) => Promise<void> | void;
    readonly vercel?: VercelSandboxCreateOptions;
}
/** Options applied when eve creates one live sandbox from a `DefaultSandbox` environment. */
export type DefaultSandboxRuntimeOptions = SandboxNetworkOptions;
/** Live sandbox capabilities exposed by a `DefaultSandbox` environment. */
export interface DefaultSandboxSession extends SandboxSession {
    /**
     * Applies a network policy to the live sandbox. Docker accepts only
     * `"allow-all"` and `"deny-all"`; just-bash accepts only `"allow-all"`.
     */
    setNetworkPolicy(policy: SandboxNetworkPolicy): Promise<void>;
}
/**
 * Selects Vercel Sandbox on Vercel, Docker when a daemon is reachable, and
 * just-bash in development. Preparation records the choice, so the runtime
 * uses the provider the build selected and never probes the host.
 */
export declare const DefaultSandbox: SandboxProvider<DefaultSandboxEnvironmentOptions, DefaultSandboxRuntimeOptions, DefaultSandboxSession>;
