import { type ProgrammaticAgentSource } from "#compiler/source-graph.js";
import { type JsonObject } from "#shared/json.js";
/** The small descriptor used for extensions shipped inside eve. */
export interface BundledExtensionDescriptor {
    readonly entryPath: string;
    readonly importSpecifier: string;
    readonly config: JsonObject;
    readonly namespace: string;
    readonly sourceDirectory: string;
}
export interface BundledExtensionMount {
    readonly declaration: ProgrammaticAgentSource;
    readonly entryPath: string;
    readonly importSpecifier: string;
    readonly config: JsonObject;
    readonly namespace: string;
    readonly packageName: string;
    readonly packageRoot: string;
    readonly sourceRoot: string;
    readonly specifier: string;
}
/** Adapts one bundled descriptor to the virtual extension mount consumed by discovery. */
export declare function createBundledExtensionMount(descriptor: BundledExtensionDescriptor): BundledExtensionMount;
