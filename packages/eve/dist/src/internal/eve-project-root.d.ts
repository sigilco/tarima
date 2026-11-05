import { type ProjectSource } from "#discover/project-source.js";
/** Find the nearest package boundary and return it only when it owns an eve project. */
export declare function findEveProjectRoot(startPath: string, options?: {
    readonly source?: ProjectSource;
}): Promise<string | undefined>;
