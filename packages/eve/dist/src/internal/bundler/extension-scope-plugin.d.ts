/**
 * One extension's on-disk source root paired with its logical mount identity.
 */
interface ExtensionScope {
    /** Absolute path to the extension's source root. */
    readonly sourceRoot: string;
    readonly mountId: string;
}
/** The subset of the rolldown/rollup plugin shape this plugin implements. */
export interface ExtensionScopeBundlerPlugin {
    readonly name: string;
    readonly resolveId: {
        readonly filter: {
            readonly id: RegExp;
        };
        handler(source: string, importer: string | undefined): string | undefined;
    };
    readonly load: {
        readonly filter: {
            readonly id: RegExp;
        };
        handler(id: string): {
            code: string;
            moduleType: "js";
        } | undefined;
    };
}
/**
 * Path-containment scope plugin for the whole-application bundle (the production
 * build). Any module physically under an extension's source root has its
 * `eve/context` imports redirected to a mount-owned state shim.
 *
 * Returns `null` when there are no extensions, so consumer-only builds carry no
 * extra plugin and their output is byte-identical to a non-extension build.
 */
export declare function createExtensionScopePlugin(scopes: readonly ExtensionScope[]): ExtensionScopeBundlerPlugin | null;
/**
 * Fixed-mount scope plugin for a single extension-owned module bundle (the
 * dev/eval per-module loader). The compiler already knows the owning mount,
 * so every module in the bundle — the entry plus its same-package dependencies —
 * is scoped, with no reliance on
 * filesystem path matching (which is unreliable under workspace symlinks).
 */
export declare function createFixedMountScopePlugin(mountId: string): ExtensionScopeBundlerPlugin;
export {};
