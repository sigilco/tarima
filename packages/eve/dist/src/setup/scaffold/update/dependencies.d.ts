export interface EnsurePackageDependenciesOptions {
    readonly dependencies: Readonly<Record<string, string>>;
    readonly projectRoot: string;
}
export interface PackageDependencyMutation {
    readonly dependencies: readonly string[];
    readonly devDependencies: readonly string[];
    readonly path: string;
    readonly scripts: readonly string[];
}
/** Adds missing or outdated runtime dependencies to an existing package.json. */
export declare function ensurePackageDependencies(options: EnsurePackageDependenciesOptions): Promise<readonly PackageDependencyMutation[]>;
