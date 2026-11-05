export declare function isVercelSnapshotUnavailableError(error: unknown): boolean;
/**
 * A resume that found the sandbox's snapshot expired or deleted: 410 with the
 * `snapshot_not_found` code, rather than any other 410.
 */
export declare function isVercelSnapshotNotFoundError(error: unknown): boolean;
/**
 * A create that lost the race for a sandbox name. The Sandbox API answers a
 * taken name with 400 `bad_request` "A sandbox with the name '…' already
 * exists"; 409 is accepted too in case it moves to a proper Conflict.
 */
export declare function isVercelSandboxNameConflictError(error: unknown): boolean;
export declare function isVercelSandboxMissingError(error: unknown): boolean;
