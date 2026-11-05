/** Imports an optional engine from the application without installing it. */
export declare function importInstalledEnginePackage<T>(input: {
    readonly appRoot: string;
    readonly packageName: string;
}): Promise<T>;
/**
 * Loads an optional engine without installing it: from eve's own resolution
 * first, then from the application. Fails with `missingMessage`.
 */
export declare function importOptionalEnginePackage<T>(input: {
    readonly appRoot: string;
    readonly importModule: () => Promise<T>;
    readonly missingMessage: string;
    readonly packageName: string;
}): Promise<T>;
export declare function resolveInstalledEnginePackageEntrypointHref(input: {
    readonly appRoot: string;
    readonly packageName: string;
}): Promise<string>;
/** Reads the version of an optional package installed in the application. */
export declare function readInstalledPackageVersion(input: {
    readonly appRoot: string;
    readonly packageName: string;
}): Promise<string | undefined>;
