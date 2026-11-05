import { type ToolSet } from "ai";
import type { ModelProfile } from "#harness/model-profile.js";
import type { JsonObject } from "#shared/json.js";
import type { WebSearchSelection } from "#shared/web-search.js";
/**
 * The provider backend resolved for one web search tool invocation.
 */
type WebSearchBackend = "anthropic" | "exa" | "google" | "openai" | "parallel" | GatewaySchemaBackend;
type GatewaySchemaBackend = "browserbase" | "tako";
/**
 * Returns the framework tool name that produced an upstream provider tool
 * `type`, or `null` when the type is not one we know how to remove.
 *
 * Used by the harness recovery path to decide which tools to drop when a
 * host rejects a tool. Unknown types fall through to
 * the existing terminal/recoverable handling.
 */
export declare function resolveFrameworkToolFromUpstreamType(type: string): string | null;
/**
 * Returns the output schema for the provider-managed web search tool that
 * will be injected for `backend`.
 */
export declare function resolveWebSearchOutputSchema(backend: Exclude<WebSearchBackend, GatewaySchemaBackend>): JsonObject;
/**
 * Determines the web search backend for a model. On AI Gateway it is the selected search
 * provider (Exa by default); `native` selects the model vendor's own search, or the fallback
 * when the model has none. Direct models always use their provider's native search. A model
 * left without a backend gets none (`null`).
 */
export declare function resolveWebSearchBackend(profile: ModelProfile, selection?: WebSearchSelection): WebSearchBackend | null;
/**
 * Constructs the AI SDK provider tool for web search based on the resolved
 * backend. Called once per harness step when web search is enabled.
 *
 * Dynamic imports keep unused provider SDKs out of the bundle — only the
 * provider matching the current model is loaded.
 */
export declare function resolveWebSearchProviderTool(backend: WebSearchBackend): Promise<ToolSet[string]>;
export {};
