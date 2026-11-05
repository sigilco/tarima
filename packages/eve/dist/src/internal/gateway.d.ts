/** AI Gateway model listing endpoint (OpenAI-compatible `/v1/models`). */
export declare const AI_GATEWAY_MODELS_URL = "https://ai-gateway.vercel.sh/v1/models";
/** AI Gateway model catalog endpoint, the richer variant of {@link AI_GATEWAY_MODELS_URL}. */
export declare const AI_GATEWAY_MODELS_CATALOG_URL = "https://ai-gateway.vercel.sh/v1/models/catalog";
/**
 * A `fetch` for direct AI Gateway requests that identifies eve via its
 * User-Agent product token — call sites get a decorated transport, not header
 * plumbing. Unlike the Sandbox binding's `getVercelSandboxFetch`, nothing is
 * constructed per call site, so this is a value rather than a factory.
 */
export declare const vercelGatewayFetch: typeof globalThis.fetch;
