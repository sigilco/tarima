import type { CompiledAgentManifest } from "#compiler/manifest.js";
/** How the host build treats packages it does not bundle, computed once per build. */
export interface ExternalsPolicy {
    /** Packages Nitro externalizes and traces into production output, beyond its own database. */
    readonly traceDeps: readonly string[];
    /** Imports kept external and untraced: optional engines the app did not configure. */
    readonly untracedExternals: readonly string[];
    /** Configured externals whose resolution from the written output is checked. */
    readonly checkedExternals: readonly string[];
    /** Stubs local sandbox providers out of hosted output. */
    readonly pruneSandboxProviders: boolean;
    /** Stubs development-only sandbox preparation out of production output. */
    readonly pruneDevelopmentRuntime: boolean;
}
export declare function createExternalsPolicy(input: {
    readonly manifest: CompiledAgentManifest;
    readonly development: boolean;
    readonly preset: "vercel" | undefined;
}): ExternalsPolicy;
/** Modules Nitro must bundle rather than externalize. */
export declare function createHostNoExternals(stepTargets: readonly string[]): string[];
