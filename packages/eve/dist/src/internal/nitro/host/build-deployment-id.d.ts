export declare const BUILD_DEPLOYMENT_ID_PLACEHOLDER = "eve_BUILD_DEPLOYMENT_ID_PLACEHOLDER_";
export interface BuildDeploymentFile {
    readonly relativePath: string;
    readonly bytes: Uint8Array;
}
/** Hashes files in path order while holding at most `READ_AHEAD` files in memory. */
export declare function computeBuildDeploymentId(relativePaths: readonly string[], readBytes: (relativePath: string) => Promise<Uint8Array>, extraInputs?: readonly string[]): Promise<string>;
export declare function replaceBuildDeploymentId(files: readonly BuildDeploymentFile[], deploymentId: string): BuildDeploymentFile;
