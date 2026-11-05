import type { VercelSandboxSession } from "#public/sandbox/vercel.js";
import { type SandboxProvider, type WithPrepareOption } from "#public/sandbox/provider.js";
import type { VercelSandboxCreateOptions, VercelSandboxRuntimeOptions } from "#public/sandbox/vercel-sandbox.js";
/** Vercel create options plus `prepare`, which receives a {@link VercelSandboxSession}. */
export type VercelSandboxEnvironmentOptions = WithPrepareOption<VercelSandboxCreateOptions, VercelSandboxSession>;
export type { VercelSandboxRuntimeOptions } from "#public/sandbox/vercel-sandbox.js";
export declare const VercelSandbox: SandboxProvider<VercelSandboxEnvironmentOptions | undefined, VercelSandboxRuntimeOptions, VercelSandboxSession>;
