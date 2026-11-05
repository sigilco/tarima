import type { Plugin } from "rolldown";
/** Directory beside an extension distribution's source root that holds its shared chunks. */
export declare const EXTENSION_CHUNK_DIRECTORY = "_chunks";
interface Mount {
    readonly mountId: string;
    readonly sourceRoot: string;
    readonly packageName: string;
    readonly specifier?: string;
    readonly mountSourcePath?: string;
    readonly programmaticImport?: {
        readonly specifier: string;
        readonly entryPath: string;
    };
}
/** Whether `path` is the extension's own code: its source, or a chunk shared by that source. */
export declare function isExtensionModule(path: string, root: string): boolean;
/** Isolates extension-owned source modules, but leaves ordinary dependencies shared. */
export declare function createExtensionMountPlugin(mounts: readonly Mount[], overridePaths?: ReadonlyMap<string, string>): Plugin | null;
export {};
