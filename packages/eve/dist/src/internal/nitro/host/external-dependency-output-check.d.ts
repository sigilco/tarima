import type { RolldownOutputAsset, RolldownOutputChunk } from "#internal/bundler/rolldown.js";
/** The parts of a written Rolldown bundle the check reads. */
export type CheckedBundle = Readonly<Record<string, Pick<RolldownOutputChunk, "code" | "dynamicImports" | "fileName" | "imports" | "type"> | Pick<RolldownOutputAsset, "fileName" | "type">>>;
/**
 * Fails the hosted build when a written chunk imports (statically or by a
 * literal dynamic import) a configured external that Node does not resolve,
 * from that chunk, to a file inside the output. Nitro's tracer only warns
 * when it cannot find a package to copy, so without this check the build
 * succeeds and the deployed function fails with ERR_MODULE_NOT_FOUND (or
 * ERR_PACKAGE_PATH_NOT_EXPORTED when it copied a different version).
 *
 * Resolution is Node's own ESM resolver, run by the build's Node in a child
 * process; no dependency code is loaded.
 */
export declare function checkExternalDependencyOutput(input: {
    readonly appRoot: string;
    readonly bundle: CheckedBundle;
    readonly externalDependencies: readonly string[];
    readonly outputDir: string;
}): Promise<void>;
