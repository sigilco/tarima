/** What a `defineDynamic()` file returns entries of, and how they're named. */
export interface EntryKind {
    /** What the entries are, as an error names them: `"tool"`. */
    readonly noun: string;
    /** How an author makes one: `"defineTool()"`. */
    readonly made: string;
    readonly is: (value: unknown) => boolean;
    readonly pattern: RegExp;
    readonly qualifiedPattern?: RegExp;
    readonly rule: string;
}
/**
 * The entries a `defineDynamic()` file returned, by name: `null` is none, one entry is named after
 * the file, and a map names each entry by its key, behind the file's extension namespace. No name
 * may take eve's.
 */
export declare function namedEntries(file: {
    readonly logicalPath: string;
    readonly slug: string;
    readonly extensionNamespace?: string;
}, value: unknown, kind: EntryKind): readonly {
    readonly name: string;
    readonly entry: unknown;
}[];
