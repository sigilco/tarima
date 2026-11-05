/** State a checkpoint holds that this build cannot continue; the owner that wrote it keeps the session. */
export declare class CheckpointRefusal extends Error {
}
export declare function refuse(detail: string): never;
