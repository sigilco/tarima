export declare const DEVELOPMENT_RUNTIME_ARTIFACTS_ACTIVATED_MARKER = "activated";
/** Records the instant at which an activated generation stopped being current. */
export declare function recordRetiredDevelopmentRuntimeArtifactsSnapshot(snapshotRoot: string, retiredAt?: number): Promise<void>;
/** Applies retention and reports whether any snapshots were removed. */
export declare function pruneDevelopmentRuntimeArtifactsSnapshotDirectory(input: {
    readonly activeSnapshotRoot: string | undefined;
    readonly gracePeriodMs?: number;
    readonly now?: number;
    readonly retainCount?: number;
    readonly snapshotsDirectory: string;
}): Promise<boolean>;
