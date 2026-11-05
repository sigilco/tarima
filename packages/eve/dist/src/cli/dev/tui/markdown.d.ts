/**
 * Whether prose responses should be parsed and styled as Markdown.
 * `EVE_TUI_RENDER_MARKDOWN=0` bypasses Markdown parsing and styling.
 */
export declare function detectMarkdownRendering(env?: {
    readonly EVE_TUI_RENDER_MARKDOWN?: string;
}): boolean;
/** Renders parsed GFM blocks for terminal presentation. */
export declare function renderMarkdown(input: string, width?: number): string;
/**
 * Wraps `label` in an OSC 8 hyperlink to `href`, underlined. Terminals
 * without OSC 8 show the plain label. Unsafe hrefs return the label as-is.
 */
export declare function renderHyperlink(label: string, href: string): string;
