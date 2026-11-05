import { type Span, type SpanContext } from "#compiled/@opentelemetry/api/index.js";
export interface ChannelRequestTrace {
    readonly reference: SpanContext;
    channel(input: {
        channelName?: string;
        channelKind?: string;
    }): void;
}
/**
 * The request span ends when the response body finishes, errors, or is
 * cancelled, not when the handler returns.
 */
export declare function traceChannelRequest(input: {
    readonly request: Request;
    readonly routeKey: string;
}, handler: (operation: ChannelRequestTrace | undefined) => Promise<Response>): Promise<Response>;
export declare function traceConnectionEventRequest(request: Request, handler: (span: Span | undefined) => Promise<Response>): Promise<Response>;
