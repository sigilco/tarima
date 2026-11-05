type DefinitionSourceKind = "connection" | "tool";
type DefinitionSourceEntry = {
    readonly kind: DefinitionSourceKind;
    readonly logicalPath?: string;
    readonly name: string;
};
export type RegisteredDefinitionSource = {
    readonly kind: DefinitionSourceKind;
    readonly names: ReadonlySet<string>;
} | {
    readonly kind: "ambiguous";
};
/** Stamps the authoring-time fallback key used for copies eve never loaded. */
export declare function stampDefinitionKey(definition: object, key: string): void;
/**
 * Fallback key shared by the connection factories and the resolver. The
 * description keeps connections on one host, such as Jira and Confluence,
 * distinct.
 */
export declare function connectionDefinitionKey(url: string, description: string): string;
/**
 * Records a definition object eve loaded under one mounted name. The same
 * object can be mounted more than once, for example when a subagent re-exports
 * an extension tool, so every mounted name matches it.
 *
 * `fallbackKey` also lets copies with the same stamped key match. That
 * fallback is marked ambiguous when different objects with different names
 * share it.
 */
export declare function registerDefinitionSource(definition: object, entry: DefinitionSourceEntry, fallbackKey?: string): void;
export declare function readDefinitionSource(definition: object): RegisteredDefinitionSource | undefined;
export {};
