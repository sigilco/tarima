/** TypeScript signatures for catalog entries, rendered from the schemas each call sees. */
import type { HarnessToolDefinition } from "#harness/execute-tool.js";
import type { ResolvedConnectionDefinition } from "#runtime/types.js";
import type { ConnectionToolMetadata } from "#shared/connection-types.js";
/**
 * An agent entry's signature, from the schemas the model would see for it.
 * A caller that already converted the input schema passes it in.
 */
export declare function entrySignature(definition: HarnessToolDefinition, inputSchema?: import("../../shared/json.ts").JsonObject): string;
/** A connection tool's signature under its full name. */
export declare function connectionToolSignature(connection: ResolvedConnectionDefinition, tool: ConnectionToolMetadata): string;
