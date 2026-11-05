export declare function rememberModelTeamSlug(teamId: string, slug: string): void;
/** Resolves display metadata without changing credentials or linking a project. */
export declare function resolveModelTeamSlug(signal?: AbortSignal): Promise<string | undefined>;
