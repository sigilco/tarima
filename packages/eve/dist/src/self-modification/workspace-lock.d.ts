/** Serializes operations that require an exclusive view of one self-modification workspace. */
export declare function withSelfModificationWorkspaceLock<T>(workspaceKey: string, operation: () => Promise<T>): Promise<T>;
