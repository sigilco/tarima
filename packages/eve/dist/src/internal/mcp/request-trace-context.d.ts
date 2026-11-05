import { type Context } from "#compiled/@opentelemetry/api/index.js";
/**
 * Adopts the W3C trace context an MCP client sends in a request's
 * `params._meta` as the parent of everything the request runs.
 *
 * Only `traceparent` and `tracestate` are read, and each is validated and
 * bounded; anything malformed leaves `parent` as it was. `baggage` is never
 * read: an MCP caller cannot choose eve's audience, session lineage, or
 * content capture by sending it. Every other value already on `parent`,
 * error-content policy included, is kept.
 */
export declare function withMcpRequestTraceContext(parent: Context, body: unknown): Context;
