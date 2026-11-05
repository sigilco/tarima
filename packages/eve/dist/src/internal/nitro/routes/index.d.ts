/** Render the shared lightweight deployment status page. */
export declare function buildHomePageHtml(input: {
    readonly name: string;
    readonly statusDetail: string;
    readonly terminalCommand?: string;
}): string;
/**
 * Builds the barebones home page response for one request. Exposed
 * for tests so callers can supply a real {@link Request}; production
 * traffic flows through the Nitro {@link H3Event} default export.
 */
export declare function buildHomePageResponse(input: {
    readonly agentName: string;
}, request: Request): Response;
