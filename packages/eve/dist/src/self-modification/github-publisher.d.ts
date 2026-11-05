import type { GitHubCredentialProvider } from "./remote/config.js";
import type { PreparedSelfModificationWorkspace } from "./git-workspace.js";
import { captureSelfModificationProposal } from "./proposal.js";
export interface PublishedSelfModificationProposal {
    readonly changedPaths: readonly string[];
    readonly commitSha: string;
    readonly pullRequestUrl: string;
    readonly repository: string;
    readonly targetBranch: string;
    readonly branch: string;
    readonly draft: true;
    readonly merged: false;
    readonly deployed: false;
}
interface GitHubDraftPublisherInput {
    readonly credentialProvider: GitHubCredentialProvider;
    readonly description: string;
    readonly fetch?: typeof fetch;
    /** Derived by the trusted parent/session lineage, never from model tool input. */
    readonly operationId: string;
    readonly sandbox: Parameters<typeof captureSelfModificationProposal>[0]["sandbox"];
    readonly title: string;
    readonly workspace: PreparedSelfModificationWorkspace;
}
/** Captures agent-only edits, then publishes one replay-safe draft pull request. */
export declare function publishGitHubDraftPullRequest(input: GitHubDraftPublisherInput): Promise<PublishedSelfModificationProposal>;
export declare function selfModificationBranchName(baseSha: string, operationId: string): string;
export {};
