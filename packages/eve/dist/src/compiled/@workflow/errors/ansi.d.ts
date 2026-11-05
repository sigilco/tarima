/** A "help:" line: use for the primary suggested fix. */
export declare function help(messages: string | string[]): string;
/** A "hint:" line: use for supplementary context or suggestions. */
export declare function hint(messages: string | string[]): string;
/** A "note:" line: use for informational context. */
export declare function note(messages: string | string[]): string;
/** A "docs:" line: use for a single documentation URL. */
export declare function docs(url: string): string;
/** Render an inline code token (italicized, dim backticks). */
export declare function code(str: string): string;
/** Apply dim styling to a string (used for de-emphasizing separators). */
export declare function dim(str: string): string;
/** Bold styling (used for emphasizing class names in headers). */
export declare function bold(str: string): string;
/** Red styling (used for the user-error attribution badge). */
export declare function red(str: string): string;
/** Magenta styling (used for the SDK-error attribution badge). */
export declare function magenta(str: string): string;
/**
 * Frame a title with one or more continuation lines, drawn with
 * box-drawing characters. The last content uses `╰▶`, others use `├▶`.
 * Multi-line contents are indented under their branch.
 *
 * @example
 * frame('Something went wrong', ['why it happened', hint('how to fix it')])
 * // Something went wrong
 * // ├▶ why it happened
 * // ╰▶ hint: how to fix it
 */
export declare function frame(title: string, contents: string[]): string;
interface Explain {
    text: string;
    explain: string;
    /** adds ansi coloring */
    color?: (s: string) => string;
}
type Explainish = Explain | [text: string, explain: string, opts?: {
    color: Explain['color'];
}];
/**
 * Tagged template for underlining tokens in a source string and annotating
 * them with explanations. Useful for pointing out offending tokens in
 * user-authored code.
 *
 * @example
 * inline`function ${{ text: 'hello', explain: 'name not allowed' }}() {
 *   return 666
 * }`
 * // function hello() {
 * //          ──┬──
 * //            ╰▶ name not allowed
 * //   return 666
 * // }
 */
export declare function inline(text: TemplateStringsArray, ...values: Explainish[]): string;
export {};
//# sourceMappingURL=ansi.d.ts.map