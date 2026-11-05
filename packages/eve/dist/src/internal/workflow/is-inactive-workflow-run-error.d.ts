/** The run's data passed the World's retention; retrying cannot bring it back. */
export declare function isExpiredWorkflowRunError(error: unknown): boolean;
export declare function isMissingWorkflowRunError(error: unknown): boolean;
export declare function isInactiveWorkflowRunError(error: unknown): boolean;
