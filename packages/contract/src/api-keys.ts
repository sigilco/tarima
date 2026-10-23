/** API keys: `tri_`-prefixed bearer keys for curl/MCP consumers. */
import * as v from "valibot";

/** Generate with the auth-core keygen; the secret itself never round-trips. */
export const API_KEY_PREFIX = "tri_";

export const apiKeySchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  prefix: v.pipe(v.string(), v.startsWith(API_KEY_PREFIX), v.maxLength(12)),
  /** Subset of capabilities, e.g. ["projects:read", "entities:write"]. */
  scopes: v.array(
    v.picklist(["projects:read", "projects:write", "entities:read", "entities:write"] as const),
  ),
  createdAt: v.pipe(v.string(), v.isoTimestamp()),
  lastUsedAt: v.optional(v.pipe(v.string(), v.isoTimestamp())),
});
export type ApiKey = v.InferOutput<typeof apiKeySchema>;

export const createApiKeySchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  scopes: apiKeySchema.entries.scopes,
});
export type CreateApiKey = v.InferInput<typeof createApiKeySchema>;

/** Response that carries the one-time full secret. */
export const createdApiKeySchema = v.intersect([
  apiKeySchema,
  v.object({ secret: v.pipe(v.string(), v.startsWith(API_KEY_PREFIX)) }),
]);
export type CreatedApiKey = v.InferOutput<typeof createdApiKeySchema>;
