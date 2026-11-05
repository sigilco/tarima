import type { BuildOptions, OutputAsset, OutputChunk, RolldownOutput } from "rolldown";
export type RolldownOutputChunk = OutputChunk;
export type RolldownOutputAsset = OutputAsset;
/** eve's Rolldown package directory, which Nitro builds with through `deps.paths`. */
export declare function resolveRolldownPackageDir(): string;
export declare function parseWithRolldownAst(filename: string, sourceText: string): Promise<unknown>;
/**
 * Runs a raw Rolldown build. Prefer {@link buildSingleRolldownChunk} for any
 * bundle whose consumer expects one in-memory file; use this directly only
 * for multi-file, written-to-disk output. Warnings raised only by dependency
 * code are dropped unless the caller supplies its own `onLog`, except
 * unresolved imports. Pseudo-packages such as `server-only` load as empty
 * modules ahead of every caller plugin.
 */
export declare function buildWithRolldown(options: BuildOptions): Promise<RolldownOutput>;
export declare const ROLLDOWN_STANDARD_CONDITION_NAMES: ReadonlySet<string>;
/**
 * Runs a Rolldown build whose contract is exactly one in-memory chunk:
 * code splitting is disabled and the result is asserted to contain a
 * single JavaScript chunk, so dynamic imports are inlined rather than
 * split into lazy chunks. Every eve single-file bundle (the authored-module
 * evaluator, immutable development generations, and workflow step/function
 * bundles) goes through this helper so the single-file policy and its
 * assertion cannot drift apart. The final Nitro production server build
 * does not use it and keeps code splitting enabled.
 */
export declare function buildSingleRolldownChunk(description: string, options: BuildOptions): Promise<RolldownOutputChunk>;
