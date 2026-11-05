/**
 * Display text for an eve identifier, such as a tool, agent, or skill name:
 * `code__code_reviewer` → `code reviewer`, `getPRStatus` → `get PR status`.
 * Only the last `__` segment names the thing; the segments before it are the
 * extension or memory namespace it was mounted under, which means nothing to
 * someone reading a status.
 */
export declare function displayName(identifier: string): string;
/** {@link displayName} in sentence case, for the start of a title: `Code reviewer`. */
export declare function displayTitle(identifier: string): string;
/**
 * Display text for a proper noun, such as a connection name: `my_crm` →
 * `My crm`. It keeps the author's casing, since `GitHub` is one word.
 */
export declare function displayProperName(identifier: string): string;
