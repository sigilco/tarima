import { type ToolContext } from "eve/tools";
/** Registry categories an integration search can be narrowed to. */
declare const CATEGORIES: readonly ["channel", "connection", "extension", "instrumentation", "memory"];
type Category = (typeof CATEGORIES)[number];
/** One catalog entry, narrowed from the published registry index. */
export interface CatalogEntry {
    readonly address: string;
    readonly title: string;
    readonly description?: string;
    readonly category?: Category;
    readonly requires?: string;
    /** Authored path this item installs, used to detect an existing install. */
    readonly authoredTarget?: string;
    /** Whether `meta.eve.setup` declares one or more setup commands. */
    readonly declaresSetup?: boolean;
    /** Whether any file would replace the self-modification extension mount. */
    readonly selfModificationMount?: boolean;
    /** Names of environment variables the item declares. */
    readonly envVars?: readonly string[];
}
/** One row returned to the model. */
export interface FoundIntegration {
    readonly address: string;
    readonly title: string;
    readonly description?: string;
    readonly category?: Category;
    readonly requires?: string;
    readonly installed?: boolean;
}
/**
 * Narrows the published registry index into catalog entries.
 *
 * Unreadable entries are skipped rather than failing the whole search: the
 * index is owned by the registry and may carry fields this version predates.
 */
export declare function parseRegistryIndex(value: unknown): readonly CatalogEntry[];
/**
 * Filters and bounds catalog entries for one search.
 *
 * Category filters match the leading segment of each registry address.
 */
export declare function selectIntegrations(input: {
    readonly category?: Category;
    readonly entries: readonly CatalogEntry[];
    readonly limit?: number;
    readonly query?: string;
}): readonly FoundIntegration[];
export declare function selectIntegrationPage(input: {
    readonly category?: Category;
    readonly entries: readonly CatalogEntry[];
    readonly limit?: number;
    readonly offset?: number;
    readonly query?: string;
}): {
    readonly hasMore: boolean;
    readonly items: readonly FoundIntegration[];
    readonly nextOffset?: number;
    readonly total: number;
};
/**
 * Resolves the registry index URL, honoring the same development override the
 * eve CLI reads.
 *
 * The override decides which registry the agent trusts, so it enforces the same
 * rules as `resolveOfficialRegistryUrl` in eve's registry command: HTTP(S) only,
 * no embedded credentials, no query or fragment. The rules are restated here
 * rather than imported because that module reaches the registry client, which
 * has no place in an agent runtime.
 */
export declare function officialRegistryIndexUrl(): string;
export declare function resolveRegistryIndexUrl(configured?: string | undefined): string;
/** Clears the module-level index cache. Test seam. */
export declare function clearRegistryIndexCache(): void;
export declare function loadRegistryIndex(input: {
    readonly nowMs: number;
    readonly signal?: AbortSignal;
    readonly url: string;
}): Promise<readonly CatalogEntry[]>;
declare const _default: import("eve/tools").ToolDefinition<Record<string, unknown>, {
    errors: {
        message: string;
        registry: string;
    }[];
    hasMore: boolean;
    items: readonly FoundIntegration[];
    nextOffset?: number;
    total: number;
}> & {
    execute(input: Record<string, unknown>, ctx: ToolContext): Promise<{
        errors: {
            message: string;
            registry: string;
        }[];
        hasMore: boolean;
        items: readonly FoundIntegration[];
        nextOffset?: number;
        total: number;
    }>;
};
export default _default;
