interface ExtensionExternalDependencyMount {
    readonly externalDependencies: readonly string[];
    readonly sourceRoot: string;
}
/** Resolves each extension-owned runtime package's entry from the extension that declared it. */
export declare function resolveExtensionExternalDependencyPaths(mounts: readonly ExtensionExternalDependencyMount[]): Record<string, string>;
export {};
