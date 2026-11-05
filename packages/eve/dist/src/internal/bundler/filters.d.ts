export declare function escapeRegex(value: string): string;
export declare function exactRegex(value: string, flags?: string): RegExp;
export declare function prefixRegex(value: string, flags?: string): RegExp;
/**
 * Matches any of `paths` as a module id, ignoring a query or hash suffix.
 * Windows paths compare case-insensitively, as the filesystem does.
 */
export declare function pathsRegex(paths: readonly string[], platform?: NodeJS.Platform): RegExp;
