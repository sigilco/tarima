import type { Attributes } from "./types.js";
import type { ContentSerializer } from "./types.js";
export interface McpUpdate {
    readonly connectionName?: string;
    readonly method?: string;
    readonly toolName?: string;
    readonly protocolVersion?: string;
    readonly requestId?: string;
    readonly sessionId?: string;
    readonly statusCode?: string | number;
}
export interface McpLifecycle {
    update(input: McpUpdate): void;
    error(error?: unknown, type?: string): void;
    arguments(value: unknown): void;
    result(value: unknown): void;
}
export declare function mcpLifecycle(input: {
    readonly write: (attributes: Attributes) => void;
    readonly error: (error?: unknown, type?: string) => void;
    readonly serializer: ContentSerializer;
    readonly recordInputs: boolean;
    readonly recordOutputs: boolean;
}): McpLifecycle;
