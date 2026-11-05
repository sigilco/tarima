import { type RuntimeSandboxSession, type SandboxSelectorContext } from "#public/definitions/sandbox.js";
import { type SelfModificationConfig } from "./config.js";
export interface SelfModificationSandboxOptions {
    readonly config?: SelfModificationConfig;
}
export interface SelfModificationSandbox {
    (context: SandboxSelectorContext): Promise<RuntimeSandboxSession> | RuntimeSandboxSession;
}
/** Defines the local self-modification sandbox; source mounts exist only during development. */
export declare function defineSelfModificationSandbox(options?: SelfModificationSandboxOptions): SelfModificationSandbox;
declare const _default: SelfModificationSandbox;
export default _default;
