/** A path, query, header, or cookie parameter resolved from an operation. */
export interface OpenApiParameter {
    readonly name: string;
    readonly location: "path" | "query" | "header" | "cookie";
    readonly required: boolean;
    readonly schema: Record<string, unknown>;
    readonly description?: string;
}
/** A request body resolved from an operation. */
export interface OpenApiRequestBody {
    readonly required: boolean;
    readonly contentType: string;
    readonly schema: Record<string, unknown>;
}
/**
 * Builds the combined JSON Schema the model fills in: each path, query,
 * and header parameter becomes a top-level property; the request body
 * (when present) is nested under `body`. The component schemas they refer
 * to sit under `$defs`.
 */
export declare function buildInputSchema(parameters: readonly OpenApiParameter[], requestBody: OpenApiRequestBody | undefined, defs: Readonly<Record<string, unknown>>): Record<string, unknown>;
/** Resolves a single `$ref` node one hop; returns the node unchanged otherwise. */
export declare function deref(document: Record<string, unknown>, node: Record<string, unknown>): unknown;
/** Converts one operation's schemas, collecting what they refer to. */
export interface SchemaConverter {
    /**
     * Converts an OpenAPI schema to JSON Schema draft 2020-12. Each local
     * `$ref` points into {@link defs}, which gets the converted target once.
     */
    readonly convert: (schema: unknown) => unknown;
    /** The converted `$ref` targets, keyed by the names `convert` points at. */
    readonly defs: Readonly<Record<string, unknown>>;
}
/**
 * Creates a converter for one operation's input schema.
 *
 * `$ref`s stay references instead of being copied in place, so a schema
 * shared by many properties, or one that refers to itself (Notion blocks),
 * costs its size once. Copying them in place would grow exponentially and
 * need a depth limit that cuts valid deep schemas off.
 */
export declare function createSchemaConverter(document: Record<string, unknown>): SchemaConverter;
/** Narrows `unknown` to a readonly array, used pervasively when duck-typing spec nodes. */
export declare function isArray(value: unknown): value is readonly unknown[];
