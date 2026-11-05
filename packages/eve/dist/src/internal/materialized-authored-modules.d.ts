import type { PreparedAuthoredRuntimeModules } from "#internal/authored-runtime-modules.js";
/**
 * The materialized instrumentation modules, mirroring the layout they were
 * authored in. Paths are relative to `.eve/compile`.
 */
export interface MaterializedInstrumentation {
    readonly kind: "directory";
    readonly modulePathsBySlot: Readonly<Record<string, string>>;
}
interface MaterializedAuthoredModuleIndex {
    readonly fingerprint: string;
    readonly instrumentation?: MaterializedInstrumentation;
    readonly moduleMap: string;
    readonly version: 3;
}
export declare function writeMaterializedAuthoredModules(input: {
    readonly prepared: PreparedAuthoredRuntimeModules;
    readonly runtimeAppRoot: string;
}): Promise<MaterializedAuthoredModuleIndex>;
export declare function readMaterializedAuthoredModuleIndex(runtimeAppRoot: string): Promise<MaterializedAuthoredModuleIndex | undefined>;
export {};
