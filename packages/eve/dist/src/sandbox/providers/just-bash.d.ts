import type { JustBashSandboxCreateOptions } from "#public/sandbox/just-bash-sandbox.js";
import { type WithPrepareOption } from "#public/sandbox/provider.js";
import type { SandboxSession } from "#public/sandbox/index.js";
export type JustBashEnvironmentOptions = WithPrepareOption<JustBashSandboxCreateOptions, SandboxSession>;
export declare const JustBashSandbox: import("#public/sandbox/provider.js").SandboxProvider<WithPrepareOption<JustBashSandboxCreateOptions, SandboxSession>, undefined, SandboxSession>;
