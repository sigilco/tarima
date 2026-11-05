import type { SpanProcessor } from "#compiled/@vercel/otel/index.js";
/** Routes spans from agent-owned traces to provider-neutral child processors. */
export declare class AgentTraceSpanProcessor implements SpanProcessor {
    #private;
    constructor(children: readonly SpanProcessor[]);
    forceFlush(): Promise<void>;
    onStart(span: unknown, parentContext: unknown): void;
    onEnd(span: unknown): void;
    /** Trace IDs protected by an unfinished activation or pending final writes. */
    activeTraceIds(): ReadonlySet<string>;
    /** Called only after writes drain; recently completed IDs still accept late descendants. */
    releaseCompletedTraces(): boolean;
    /** Releases only traces owned by this conversation. */
    releaseConversation(conversationId: string): boolean;
    shutdown(): Promise<void>;
}
