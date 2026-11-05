import type { CompiledAgentManifest } from "#compiler/manifest.js";
/**
 * Optional sandbox engines eve's runtime reaches through lazy dynamic imports.
 * Bundlers follow literal dynamic imports, so mere resolvability (for example
 * eve's own workspace devDependencies) would pull them into every hosted
 * build. The compiled sandbox config's backend names are the app's opt-in.
 */
export declare const OPTIONAL_ENGINE_PACKAGES_BY_BACKEND_NAME: Readonly<Record<string, string>>;
/**
 * Packages the production host externalizes and traces wherever the hosted graph imports them.
 * Extension-owned externals are `name*` patterns. Generated bundles read this list too, so the
 * packages they hand to the host can't widen what these patterns match.
 */
export declare function collectHostTracedDependencies(manifest: CompiledAgentManifest): string[];
/** Whether a package name matches a host-traced dependency, including `name*` patterns. */
export declare function matchesHostTracedDependency(packageName: string, tracedDependencies: readonly string[]): boolean;
