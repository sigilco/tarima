/**
 * Shared identity for eve integrations. This package is the single source of
 * truth for *which* integrations exist (channels, connections, extensions, and
 * instrumentation providers) and how a connection is wired (transport +
 * model-facing description).
 *
 * Surface-specific concerns live with their consumer, keyed by {@link
 * IntegrationEntry.slug}: the scaffolder (eve) overlays the
 * Connect auth spec it emits, and the docs gallery overlays presentation
 * (logo, keywords, auth modes, hand-authored markdown). Neither re-declares the
 * identity below.
 *
 * Everything lives in this one module on purpose. The catalog is consumed
 * directly from source by both NodeNext tooling (`tsc` in eve,
 * which requires explicit `.js` import extensions) and Turbopack (the docs app,
 * which cannot resolve `.js` specifiers back to `.ts`). A single file with no
 * relative imports is the only shape that satisfies both without per-consumer
 * resolver configuration.
 */
/** Surface an integration targets. Extend as new kinds are catalogued. */
export type IntegrationKind = "channel" | "connection" | "extension" | "instrumentation" | "memory";
/** Wire protocol a connection speaks at runtime. */
export type ConnectionProtocol = "mcp" | "openapi";
/** MCP transport: a single server URL, with optional static headers. */
export interface McpTransport {
    url: string;
    /** Static, non-secret headers sent on every request (literal values). */
    headers?: Record<string, string>;
}
/** OpenAPI transport: a spec document plus the API base URL. */
export interface OpenApiTransport {
    spec: string;
    baseUrl: string;
    /** Static, non-secret headers sent on every request (literal values). */
    headers?: Record<string, string>;
}
/** Transport + description identity for a connection; protocols are derived. */
export interface ConnectionIdentity {
    /** Model-facing description written into the generated definition. */
    description: string;
    mcp?: McpTransport;
    openapi?: OpenApiTransport;
}
/** Which eve surfaces an integration is available on today. */
export interface IntegrationSurfaces {
    /** eve's interactive setup flow can provision and scaffold this integration. */
    scaffoldable: boolean;
    /** Available as an `eve add` registry item. */
    registry: boolean;
    /** Listed in the docs integrations gallery. */
    gallery: boolean;
}
/** Canonical identity for one integration, shared across every surface. */
export interface IntegrationEntry {
    /** Filename + lookup key + runtime name (e.g. `linear`). Derived once. */
    slug: string;
    /** Human label (e.g. `Linear`). */
    name: string;
    kind: IntegrationKind;
    /** One-line summary; reused by docs gallery cards and CLI hints. */
    tagline: string;
    surfaces: IntegrationSurfaces;
    /** Present only for `kind: "connection"`. */
    connection?: ConnectionIdentity;
}
/** Protocols a connection speaks, derived from its declared transports. */
export declare function connectionProtocols(connection: ConnectionIdentity): ConnectionProtocol[];
/**
 * The canonical set of eve integrations. Order is display order. Each entry
 * carries only shared identity; the scaffolder and docs overlay their own
 * surface-specific data keyed by {@link IntegrationEntry.slug}.
 */
export declare const INTEGRATIONS: readonly IntegrationEntry[];
/** Returns the catalog entry for a slug, or `undefined` when not catalogued. */
export declare function getIntegrationEntry(slug: string): IntegrationEntry | undefined;
/** All entries of a kind, in catalog order. */
export declare function integrationsByKind(kind: IntegrationKind): IntegrationEntry[];
/** All connection entries, in catalog order. */
export declare function connectionEntries(): IntegrationEntry[];
/** All channel entries, in catalog order. */
export declare function channelEntries(): IntegrationEntry[];
/** All extension entries, in catalog order. */
export declare function extensionEntries(): IntegrationEntry[];
/** All instrumentation entries, in catalog order. */
export declare function instrumentationEntries(): IntegrationEntry[];
/** All memory provider entries, in catalog order. */
export declare function memoryEntries(): IntegrationEntry[];
