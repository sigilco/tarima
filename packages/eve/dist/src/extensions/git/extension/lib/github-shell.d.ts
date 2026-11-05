import type { SessionAuthContext } from "eve/context";
import type { SandboxSession } from "eve/sandbox";
import type { ToolContext } from "eve/tools";
import { type GitHubCoAuthor } from "./attribution.ts";
export type { GitHubCoAuthor } from "./attribution.ts";
export interface GitHubShellInput {
    readonly command: string;
    readonly description: string;
    /** The `owner/name` repository the command acts on, an `owner` for discovery, or omitted. */
    readonly repository?: string;
    readonly workingDirectory?: string;
}
export interface GitHubShellOutput {
    readonly exitCode: number;
    readonly stderr: string;
    readonly stdout: string;
    readonly truncated: boolean;
}
/** Resolves the co-author credited by this turn's GitHub publishing commands. */
export type GitHubAttribution = (ctx: ToolContext) => GitHubCoAuthor | null | PromiseLike<GitHubCoAuthor | null>;
interface GitHubConfigBase {
    /**
     * Resolves who the current turn publishes for. When it returns a person,
     * `gh-signed-commit` messages and `gh pr create` bodies end with their
     * `Co-authored-by` trailer. Return `null` to publish without one. It
     * receives the `gh` tool's context, so `ctx.getToken` can resolve the
     * requester's linked accounts.
     */
    readonly attribution?: GitHubAttribution;
    readonly broker: (sandbox: SandboxSession, rules: Readonly<Record<string, readonly GitHubLeaseRule[]>> | null) => Promise<void>;
    readonly connector: string;
}
/** Mints GitHub App installation tokens scoped to the declared repository or owner. */
export interface GitHubAppConfig extends GitHubConfigBase {
    /** The only access control: commands run only when it returns `true`. */
    readonly authorize: GitHubAuthorize<GitHubAppAuthorizeRequest>;
    readonly principalType: "app";
}
/** Resolves the caller's own token through `ctx.getToken`, signing them in when needed. */
export interface GitHubUserConfig extends GitHubConfigBase {
    /** The only access control: commands run only when it returns `true`. */
    readonly authorize: GitHubAuthorize<GitHubUserAuthorizeRequest>;
    readonly principalType: "user";
}
export type GitHubConfig = GitHubAppConfig | GitHubUserConfig;
/** What an `authorize` callback sees before a `gh` command runs with the caller's own token. */
export interface GitHubUserAuthorizeRequest {
    /** The parsed command, such as `["gh", "pr", "view", "7", "--repo", "acme/widgets"]`. */
    readonly argv: readonly string[];
    /** The session's current caller, or `null` when the session has none. */
    readonly auth: SessionAuthContext | null;
    /** Always `null`: user tokens cannot be restricted to the declared repository. Use app tokens for repository allowlists. */
    readonly repository: null;
    /** The token Connect minted for this command, for API lookups. It reaches the command only after `authorize` returns `true`. */
    readonly token: string;
}
/** What an `authorize` callback sees before a `gh` command runs with an installation token. */
export interface GitHubAppAuthorizeRequest extends Omit<GitHubUserAuthorizeRequest, "repository"> {
    /** The repository the installation token is scoped to, or `null` for owner-wide access. */
    readonly repository: string | null;
    /** The owner whose installation minted the token. */
    readonly owner: string;
}
export type GitHubAuthorizeRequest = GitHubAppAuthorizeRequest | GitHubUserAuthorizeRequest;
/** Decides whether the session's caller may run one `gh` command; the agent's only access control. */
export type GitHubAuthorize<Request extends GitHubAuthorizeRequest = GitHubAuthorizeRequest> = (request: Request) => boolean | Promise<boolean>;
export interface GitHubLeaseRule {
    readonly match?: {
        readonly headers?: readonly {
            readonly key?: {
                readonly exact: string;
            };
            readonly value?: {
                readonly exact?: string;
                readonly regex?: string;
            };
        }[];
    };
    readonly transform: readonly {
        readonly headers: Readonly<Record<string, string>>;
    }[];
}
interface GitHubShellDependencies {
    /** The calling tool's context, passed to `attribution`. */
    readonly context?: ToolContext;
    readonly auth?: SessionAuthContext | null;
    readonly getConnectToken?: (connector: string, params: {
        authorizationDetails: {
            type: "github_app_installation";
            org: string;
            repositories?: string[];
        }[];
        subject: {
            type: "app";
        };
    }) => Promise<string>;
    /** Resolves and re-authorizes user-scoped providers; the tool's `ctx.getToken` and `ctx.requireAuth`. */
    readonly getToken?: ToolContext["getToken"];
    readonly requireAuth?: ToolContext["requireAuth"];
    readonly getSandbox: () => Promise<SandboxSession>;
    /** Serializes credential leases per eve session; every `ctx.getSandbox()` call returns a new handle. */
    readonly sessionId: string;
}
export declare function githubShellApproval(input: GitHubShellInput | undefined): "not-applicable" | {
    type: "denied";
    reason: string;
};
export declare function executeGitHubShell(input: GitHubShellInput, config: GitHubConfig | undefined, dependencies: GitHubShellDependencies): Promise<GitHubShellOutput>;
export declare function parseCommand(command: string): string[];
