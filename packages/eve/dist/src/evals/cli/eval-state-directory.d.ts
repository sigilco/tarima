/**
 * Creates the per-run state directory for the server `eve eval` starts, after
 * removing directories left by eval runs whose process died before cleanup
 * (Ctrl-C, CI timeouts, crashes). Directories of live concurrent runs stay.
 */
export declare function createEvalStateDirectory(appRoot: string, runId: string): Promise<string>;
export declare function removeEvalStateDirectory(directory: string): Promise<void>;
