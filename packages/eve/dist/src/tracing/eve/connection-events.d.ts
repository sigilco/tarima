import { type SpanContext } from "#compiled/@opentelemetry/api/index.js";
import { type AlsContext } from "#context/container.js";
/** Only carry a validated W3C identity across durable steps, never baggage or content policy. */
export declare function connectionEventTraceContext(value: unknown): SpanContext | undefined;
export declare function connectionEventAttributes(input: {
    connectionName: string;
    sessionId?: string;
    subscriptionId?: string;
    deliveryId?: string;
    bindingId?: string;
}): Record<string, string>;
/** Preserve diagnostic categories without logging SDK request objects or provider response bodies. */
export declare function connectionEventError(error: unknown): Error;
type EventOperation = "catalog" | "subscribe" | "get" | "unsubscribe" | "onEvent" | "onGap" | "onTerminated";
/** No model turn is needed to restore a session's trace policy in a durable event step. */
export declare function withConnectionEventSpan<T>(input: {
    ctx: AlsContext;
    connectionName: string;
    operation: EventOperation;
    subscriptionId?: string;
    deliveryId?: string;
    bindingId?: string;
    requestTraceContext?: SpanContext;
}, execute: (reference?: SpanContext) => Promise<T>): Promise<T>;
export {};
