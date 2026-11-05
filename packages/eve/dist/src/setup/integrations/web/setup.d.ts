import type { RegistrySetupCompletion } from "#setup/registry-setup-protocol.js";
import type { VercelProjectReference } from "#setup/project-resolution.js";
import type { PackageManagerKind } from "#setup/package-manager.js";
import { installScaffoldDependencies } from "../shared/scaffold.js";
import { prepareWebAuthScaffold } from "./auth-scaffold.js";
import { type WebChatFramework } from "./framework.js";
import { type WebChatHostingDeps } from "./hosting.js";
import { provisionWebChatAuth } from "./provision-auth.js";
import { type SetupApplyContext, type SetupPrepareContext } from "../types.js";
export interface WebSetupDeps extends WebChatHostingDeps {
    prepareWebAuthScaffold: typeof prepareWebAuthScaffold;
    provisionWebChatAuth: typeof provisionWebChatAuth;
    installScaffoldDependencies: typeof installScaffoldDependencies;
}
interface WebSetupPlan {
    framework: WebChatFramework;
    hosting: WebChatFramework | "vercel";
    packageManager: PackageManagerKind;
    authProject?: VercelProjectReference;
    rootWebChat?: boolean;
}
export declare function prepareWebSetup(context: SetupPrepareContext, deps?: WebSetupDeps): Promise<WebSetupPlan>;
export declare function applyWebSetup(plan: WebSetupPlan, context: SetupApplyContext, deps?: WebSetupDeps): Promise<RegistrySetupCompletion>;
export declare const WEB_SETUP: import("../types.js").SetupIntegration;
export {};
