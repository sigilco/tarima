/** Joins an internal eve route to a public target, including compact named-agent mounts. */
export declare function joinEveRoutePath(basePath: string, routePath: string): string;
/** Maps a compact named-agent route back to the internal eve protocol namespace. */
export declare function normalizePublicEveRoutePath(path: string): string;
