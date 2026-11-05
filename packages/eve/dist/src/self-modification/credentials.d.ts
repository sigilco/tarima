import type { GitHubCredentialProvider, ResolvedGitHubCredentials } from "./remote/config.js";
export declare const SELF_MODIFICATION_GITHUB_TOKEN_ENV = "EVE_SELF_MODIFICATION_GITHUB_TOKEN";
/** Checks PAT availability without returning the credential. */
export declare function hasGitHubCredential(): boolean;
/** Constructs the configured provider without resolving a credential. */
export declare function createGitHubCredentialProvider(credentials: ResolvedGitHubCredentials): GitHubCredentialProvider;
