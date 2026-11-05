import { type Context as OtelContext } from "#compiled/@opentelemetry/api/index.js";
import { type ContentSerializer } from "#compiled/@vercel/agent-runs/index.js";
type Context = Pick<OtelContext, "getValue">;
export declare function createMcpTraceFetch(input: {
    readonly connectionName: string;
    readonly fetcher?: typeof fetch;
    readonly getActiveContext?: () => Context;
    readonly getProtocolVersion: () => string | undefined;
    readonly injectContext?: McpTraceContextInjector;
    readonly filterCarrier?: (carrier: Record<string, string>) => void;
}): typeof fetch;
/** Records only JSON tool arguments and results, as MCP spans carry no model content. */
export declare const MCP_SERIALIZER: ContentSerializer;
export declare function createMcpTracing(): {
    list<T>(input: {
        readonly method?: "tools/list" | "events/list";
        readonly connectionName: string;
        readonly execute: () => Promise<T>;
        readonly protocolVersion?: string;
    }): Promise<T>;
    call<T>(input: {
        readonly arguments: unknown;
        readonly connectionName: string;
        readonly execute: () => Promise<T>;
        readonly protocolVersion?: string;
        readonly toolName: string;
    }): Promise<T>;
};
type McpTraceContextInjector = (context: Context, carrier: Record<string, string>) => void;
export {};
