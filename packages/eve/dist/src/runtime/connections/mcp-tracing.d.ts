import { createMcpTraceFetch as traceFetch } from "#tracing/eve/mcp.js";
export declare function createMcpTraceFetch(input: Parameters<typeof traceFetch>[0]): typeof fetch;
export declare function withMcpToolsListSpan<T>(input: {
    connectionName: string;
    protocolVersion?: string;
    execute: () => Promise<T>;
}): Promise<T>;
export declare function withMcpToolCallSpan<T>(input: {
    connectionName: string;
    protocolVersion?: string;
    toolName: string;
    arguments: unknown;
    execute: () => Promise<T>;
}): Promise<T>;
