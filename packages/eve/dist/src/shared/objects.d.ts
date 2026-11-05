/**
 * Recursively merges plain records. Nested records are merged while arrays,
 * primitives, and exotic objects from `overrides` replace the base value.
 */
export declare function mergeObjects(base: Readonly<Record<string, unknown>>, overrides: Readonly<Record<string, unknown>> | undefined): Record<string, unknown>;
