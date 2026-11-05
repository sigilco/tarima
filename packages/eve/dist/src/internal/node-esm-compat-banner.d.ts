/**
 * Options for {@link buildNodeEsmCompatBanner} and
 * {@link createNodeEsmCompatBannerPlugin}.
 *
 * Bundle output that re-declares one of the CJS path globals at the top
 * level would otherwise collide with the banner, producing
 * `SyntaxError: Identifier '__dirname' has already been declared` at load
 * time. The banner builder omits any line whose binding the chunk already
 * provides.
 */
interface NodeEsmCompatBannerOptions {
    /** Whether to expose a CommonJS `require` shim alongside the path globals. */
    readonly includeRequire?: boolean;
}
interface ParsedNode {
    readonly body?: ParsedNode | readonly ParsedNode[];
    readonly type: string;
    readonly name?: string;
    readonly declarations?: readonly {
        readonly id: ParsedNode;
    }[];
}
interface ParsedProgram {
    readonly body: readonly ParsedNode[];
}
/**
 * Builds the ESM CommonJS-compatibility banner appropriate for a parsed
 * bundle chunk. Identifiers the chunk already binds in a top-level variable
 * declaration are skipped so the prepended banner never re-declares them.
 *
 * Returns an empty string when the chunk already provides every binding.
 */
export declare function buildNodeEsmCompatBanner(program: ParsedProgram, options?: NodeEsmCompatBannerOptions): string;
interface BannerPluginContext {
    parse(code: string): ParsedProgram;
}
interface BannerPlugin {
    readonly name: string;
    renderChunk(this: BannerPluginContext, code: string, chunk?: {
        readonly fileName?: string;
    }): {
        code: string;
        map: SourceMap;
    } | null;
}
interface SourceMap {
    readonly version: 3;
    readonly sources: readonly string[];
    readonly sourcesContent: readonly string[];
    readonly names: readonly string[];
    readonly mappings: string;
}
/**
 * Creates a bundler plugin that prepends the Node ESM compatibility
 * banner to each output chunk, skipping any banner line whose binding
 * the chunk already provides. Compatible with both Rollup and Rolldown.
 */
export declare function createNodeEsmCompatBannerPlugin(options?: NodeEsmCompatBannerOptions): BannerPlugin;
export {};
