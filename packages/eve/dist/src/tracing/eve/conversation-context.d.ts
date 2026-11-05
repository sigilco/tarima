import { type Context } from "#compiled/@opentelemetry/api/index.js";
export declare function withConversationId(context: Context, conversationId: string): Context;
interface OperationConversation {
    readonly rootSessionId?: string;
    readonly sessionId: string;
    readonly traceSessionId?: string;
}
export declare function traceSessionIdOf(scope: OperationConversation): string;
export declare function operationConversationId(input: OperationConversation): string;
export declare function withOperationTraceContext(context: Context, input: OperationConversation): Context;
export declare function conversationIdFromContext(context: unknown): string | undefined;
export declare function traceSessionIdFromContext(context: unknown): string | undefined;
export declare function readConversationBaggage(value: string | null): string | undefined;
export declare function writeConversationBaggage(value: string | undefined, conversationId: string | undefined): string | undefined;
export {};
