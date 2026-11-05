import type { SandboxSession } from "eve/sandbox";
import type { PreparedSelfModificationWorkspace } from "./git-workspace.js";
export interface ProposalChange {
    readonly bytes: number;
    readonly kind: "add" | "delete" | "modify";
    readonly mode: "100644" | "100755" | null;
    readonly objectId: string | null;
    readonly path: string;
}
export interface SelfModificationProposal {
    readonly baseSha: string;
    readonly baseTreeSha: string;
    readonly changedBytes: number;
    readonly changes: readonly ProposalChange[];
    readonly proposedTreeSha: string;
}
type ProposalSandbox = Pick<SandboxSession, "run">;
/** Captures and validates the worktree before any publication credential is resolved. */
export declare function captureSelfModificationProposal(input: {
    readonly sandbox: ProposalSandbox;
    readonly workspace: PreparedSelfModificationWorkspace;
}): Promise<SelfModificationProposal>;
/** Reads an already captured blob and verifies its Git object id before upload. */
export declare function readProposalBlob(input: {
    readonly change: ProposalChange;
    readonly sandbox: ProposalSandbox;
    readonly workspace: PreparedSelfModificationWorkspace;
}): Promise<string>;
interface RawChange {
    readonly newMode: string;
    readonly newObjectId: string;
    readonly path: string;
    readonly status: "A" | "D" | "M";
}
export declare function parseRawDiff(raw: string): readonly RawChange[];
export declare function assertAllowedChange(change: Pick<ProposalChange, "mode" | "objectId" | "path">, directory: string, protectedMounts?: readonly string[]): void;
export {};
