import type { LinqAPIV3 } from "@linqapp/sdk";
import type { FormattedContent } from "#compiled/chat/index.js";
/** Text plus the iMessage decorations that apply to ranges within it. */
export interface DecoratedText {
    value: string;
    decorations: LinqAPIV3.TextDecoration[];
}
/**
 * Renders an mdast tree to text plus the decorations its formatting implies.
 *
 * The text is byte-identical to `toPlainText` (mdast-util-to-string) so the
 * wire value is unchanged; only the decorations are new. Offsets are UTF-16
 * code units, which is what JS string indices already are and what the Linq
 * API expects.
 */
export declare function astToDecoratedText(ast: FormattedContent): DecoratedText;
/**
 * Trims surrounding whitespace, shifting decoration ranges to match.
 *
 * Trimming without this silently slides every range off its characters.
 */
export declare function trimDecoratedText({ value, decorations }: DecoratedText): DecoratedText;
/**
 * Rejects decorations the API will not accept: animation ranges may not overlap
 * any other decoration, though styles may overlap each other freely.
 */
export declare function assertDecorationsSendable(decorations: readonly LinqAPIV3.TextDecoration[]): void;
//# sourceMappingURL=text-decorations.d.ts.map