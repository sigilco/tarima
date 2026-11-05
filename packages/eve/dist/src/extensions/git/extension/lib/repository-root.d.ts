import type { SandboxSession } from "eve/sandbox";
type RootSandbox = Pick<SandboxSession, "resolvePath" | "run">;
/** A workspace directory that must also be the top of a git work tree. */
export declare function validateRepositoryRoot(sandbox: RootSandbox, root: string): Promise<string>;
export {};
