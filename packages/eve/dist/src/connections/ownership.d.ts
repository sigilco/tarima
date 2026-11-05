/**
 * A connection owns its name and every name under its `<name>__` prefix, so a
 * catalog name under that prefix always means one of the connection's tools.
 * Names are compared as written; a connection's tools are never listed to
 * check them.
 */
/** The full name of a connection tool: `linear__list_issues`. */
export declare function connectionToolName(connectionName: string, toolName: string): string;
/**
 * Throws when `name` belongs to one of `connectionNames`. `subject` names the
 * rejected entry, such as `Dynamic tool`, and `remedy` says how to fix it.
 */
export declare function assertNotConnectionOwned(input: {
    readonly connectionNames: Iterable<string>;
    readonly name: string;
    readonly remedy: string;
    readonly subject: string;
}): void;
