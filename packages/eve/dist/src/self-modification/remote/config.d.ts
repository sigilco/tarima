import type { InstrumentationChannel } from "#shared/instrumentation-channel.js";
import type { SessionAuthContext } from "#channel/types.js";
import type { AgentReasoningDefinition, AgentStaticModelDefinition } from "#public/index.js";
/** Principal and channel that requested a deployed source modification. */
export interface SelfModificationAuthorizationContext {
    readonly channel: InstrumentationChannel;
    readonly principal: SessionAuthContext | null;
}
/** Decides whether a principal may use deployed self-modification. */
export type SelfModificationAuthorization = (context: SelfModificationAuthorizationContext) => boolean | Promise<boolean>;
export interface GitHubRepository {
    readonly owner: string;
    readonly repo: string;
}
export type GitHubCredentialCapability = "checkout" | "publish";
export interface GitHubCredentialRequest {
    readonly capability: GitHubCredentialCapability;
    readonly repository: GitHubRepository;
}
/** Application-supplied GitHub credentials for deployed self-modification. */
export interface GitHubCredentialProvider {
    resolve(request: GitHubCredentialRequest): Promise<string>;
}
/** Values accepted by the `eve/extensions/self-modification/remote` extension mount. */
export interface DeployedSelfModificationConfig {
    readonly source: {
        readonly git: {
            /** GitHub repository in github.com/owner/repository form. */
            readonly repository: string;
            /** Application directory relative to the repository root. */
            readonly directory: string;
        };
    };
    readonly target: {
        readonly branch: string;
    };
    /** Fail-closed policy for principals that may create draft proposals. */
    readonly authorize: SelfModificationAuthorization;
    readonly credentials?: GitHubCredentialProvider | {
        /**
         * Reads `EVE_SELF_MODIFICATION_GITHUB_TOKEN` from the trusted deployment
         * environment; never injects it into the sandbox.
         */
        readonly pat: true;
    };
    /** Model used by the deployed self-modification subagent; defaults to the parent model. */
    readonly model?: AgentStaticModelDefinition;
    readonly reasoning?: AgentReasoningDefinition;
}
export interface ResolvedDeployedSelfModificationConfig {
    readonly authorize: SelfModificationAuthorization;
    readonly credentials: ResolvedGitHubCredentials;
    readonly directory: string;
    readonly repository: GitHubRepository;
    readonly targetBranch: string;
}
export type ResolvedGitHubCredentials = {
    readonly kind: "pat";
} | {
    readonly kind: "provider";
    readonly provider: GitHubCredentialProvider;
};
export declare function resolveDeployedSelfModificationConfig(config: DeployedSelfModificationConfig): ResolvedDeployedSelfModificationConfig;
