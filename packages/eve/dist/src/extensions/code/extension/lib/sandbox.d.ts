/** Consumer-facing helpers exported as `eve/extensions/code/sandbox`. */
import type { SandboxSession } from "eve/sandbox";
type ToolingSandbox = Pick<SandboxSession, "resolvePath" | "run" | "writeTextFile">;
/** Include in the consumer's sandbox `revalidationKey` so cached templates rebuild when the tooling changes. */
export declare const CODE_TOOLING_REVALIDATION_KEY = "eve-code-tooling:4:4";
/** Install CLI wrappers and signed commits. */
export declare function installCodeTooling(sandbox: ToolingSandbox, options?: {
    readonly vercel?: boolean;
}): Promise<void>;
export { authenticateGitHub, authenticateVercel, type BrokeredCredentialOptions, } from "./credentials.ts";
