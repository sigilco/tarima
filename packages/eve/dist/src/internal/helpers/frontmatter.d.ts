/** A document split into its YAML frontmatter and body. */
export interface FrontmatterDocument {
    /** Parsed frontmatter. An empty block parses to `{}`. */
    readonly data: unknown;
    /** Body after the closing delimiter line. */
    readonly content: string;
}
/** Reports whether a document opens with a `---` frontmatter delimiter. */
export declare function hasFrontmatter(source: string): boolean;
/**
 * Splits a document into YAML frontmatter and body. Returns `undefined` when
 * the document has no complete `---` block.
 *
 * Frontmatter is always data: js-yaml's default schema has no code-evaluating
 * types, and a fence that names any language other than YAML, such as `---js`,
 * throws instead of being interpreted.
 */
export declare function parseFrontmatter(source: string): FrontmatterDocument | undefined;
/**
 * Parses a YAML file. A file that opens and closes a `---` block parses only
 * that block, so frontmatter-style YAML files keep working. An empty file
 * parses to `{}`.
 */
export declare function parseYaml(source: string): unknown;
