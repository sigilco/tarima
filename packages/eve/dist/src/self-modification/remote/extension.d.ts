import type { StandardSchemaV1 } from "#compiled/@standard-schema/spec/index.js";
import type { DeployedSelfModificationConfig } from "./config.js";
/** Deployed self-modification mount; independent of the local development extension. */
declare const _default: import("eve/extension").ExtensionHandle<StandardSchemaV1<DeployedSelfModificationConfig, DeployedSelfModificationConfig>>;
export default _default;
export type { DeployedSelfModificationConfig, SelfModificationAuthorization, SelfModificationAuthorizationContext, GitHubCredentialProvider, GitHubCredentialRequest, GitHubCredentialCapability, GitHubRepository, } from "./config.js";
