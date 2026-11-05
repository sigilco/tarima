import type { TraceContext } from "#protocol/session-events/families/session.js";
import type { InstrumentationSessionStartedEvent, InstrumentationTraceSeed, InstrumentationTurnStartedEvent } from "#instrumentation/lifecycle.js";
/** Prepares native session/turn tracing before their durable stream events. */
export interface PrepareTurnTraceContextInput {
    readonly instrumentation?: {
        readonly prepareSessionTrace?: (event: InstrumentationSessionStartedEvent) => Promise<InstrumentationTraceSeed>;
        readonly prepareTurnTrace?: (event: InstrumentationTurnStartedEvent) => Promise<InstrumentationTraceSeed>;
    };
    readonly session: Omit<InstrumentationSessionStartedEvent, "idempotencyKey" | "type">;
    readonly principals?: Pick<InstrumentationTurnStartedEvent, "currentPrincipal" | "initiatorPrincipal">;
    readonly sequence: number;
    readonly sessionStarted: boolean;
    readonly traceContext?: TraceContext;
    /** Omit when preparing the session boundary before the first turn exists. */
    readonly turnId?: string;
}
export declare function prepareTurnTraceContext(input: PrepareTurnTraceContextInput): Promise<TraceContext | undefined>;
