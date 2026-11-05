/** Web search providers that AI Gateway runs for any Gateway model. */
export declare const WEB_SEARCH_FALLBACK_PROVIDERS: readonly ["exa", "parallel", "browserbase", "tako"];
/**
 * Web search providers available through Vercel AI Gateway. `native` is the model vendor's own
 * hosted search, which only some vendors' models have.
 */
export declare const WEB_SEARCH_PROVIDERS: readonly ["exa", "parallel", "browserbase", "tako", "native"];
export type WebSearchProvider = (typeof WEB_SEARCH_PROVIDERS)[number];
export type WebSearchFallbackProvider = (typeof WEB_SEARCH_FALLBACK_PROVIDERS)[number];
/** The Gateway search an agent selected, and what a model the provider can't serve uses instead. */
export interface WebSearchSelection {
    readonly provider: WebSearchProvider;
    /** Used when `provider` can't serve the model; without it, that model gets no `web_search`. */
    readonly fallback?: WebSearchFallbackProvider;
}
