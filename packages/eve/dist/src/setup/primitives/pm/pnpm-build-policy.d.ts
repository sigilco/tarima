export type PnpmBuildPolicyAction = "ignore-optional" | "allow-builds";
export interface PnpmBuildPolicyContext {
    readonly filePath: string;
    readonly packages: readonly string[];
    readonly satisfied: boolean;
}
/** Applies one explicit pnpm build policy while preserving unrelated workspace settings. */
export declare function withPnpmBuildPolicy(source: string, packages: readonly string[], action: PnpmBuildPolicyAction): string;
/** Adds optional-package defaults without replacing the application's explicit decisions. */
export declare function withPnpmOptionalDependencyDefaults(source: string, packages: readonly string[]): string;
/** Prepares defaults in the owning workspace before installing an optional engine. */
export declare function ensurePnpmOptionalDependencyDefaults(appRoot: string, packages: readonly string[]): Promise<void>;
/** Resolves whether every package already has an explicit non-blocking pnpm policy. */
export declare function inspectPnpmBuildPolicy(appRoot: string, packages: readonly string[]): Promise<PnpmBuildPolicyContext>;
/** Persists the policy selected before the registry installation transaction begins. */
export declare function applyPnpmBuildPolicy(context: PnpmBuildPolicyContext, action: PnpmBuildPolicyAction): Promise<void>;
