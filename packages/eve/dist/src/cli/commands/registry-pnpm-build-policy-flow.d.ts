import { detectPackageManager } from "#setup/package-manager.js";
import { type Prompter } from "#setup/prompter.js";
import { applyPnpmBuildPolicy, inspectPnpmBuildPolicy } from "#setup/primitives/pm/pnpm-build-policy.js";
import type { RegistryCommandLogger } from "./registry-recovery.js";
interface DeclaredPnpmBuildPolicy {
    readonly packages: readonly string[];
    readonly optional: true;
    readonly recommendedAction: "ignore-optional";
    readonly reason: string;
}
interface PnpmBuildPolicyFlowDependencies {
    readonly detectPackageManager: typeof detectPackageManager;
    readonly inspectPnpmBuildPolicy: typeof inspectPnpmBuildPolicy;
    readonly applyPnpmBuildPolicy: typeof applyPnpmBuildPolicy;
    readonly createPrompter: () => Prompter;
}
/** Resolves declared pnpm build-script decisions before registry installation begins. */
export declare function prepareDeclaredPnpmBuildPolicy(input: {
    readonly logger: RegistryCommandLogger;
    readonly appRoot: string;
    readonly item: string;
    readonly policies: readonly DeclaredPnpmBuildPolicy[] | undefined;
    readonly options: {
        readonly yes?: boolean;
        readonly nonInteractive?: boolean;
        readonly answers?: Readonly<Record<string, unknown>>;
        readonly prompter?: Prompter;
    };
}, dependencyOverrides?: Partial<PnpmBuildPolicyFlowDependencies>): Promise<boolean>;
export {};
