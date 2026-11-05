import type { SandboxSession } from "eve/sandbox";
import { GH_SIGNED_COMMIT_SOURCE, GH_SIGNED_COMMIT_VERSION } from "eve/internal/git";
export { GH_SIGNED_COMMIT_SOURCE, GH_SIGNED_COMMIT_VERSION };
export declare function toolingPaths(sandbox: Pick<SandboxSession, "resolvePath">): {
    root: string;
    trustedRoot: string;
    env: string;
    ghReal: "/usr/local/lib/eve-code/gh";
    ghWrapper: string;
    vercelWrapper: string;
    signedCommit: string;
    trustedSignedCommit: "/usr/local/lib/eve-code/gh-signed-commit";
};
export declare function ghWrapperSource(sandbox: Pick<SandboxSession, "resolvePath">): string;
export declare function vercelWrapperSource(sandbox: Pick<SandboxSession, "resolvePath">): string;
