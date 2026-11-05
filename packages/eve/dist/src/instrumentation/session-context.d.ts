import type { AlsContext } from "#context/container.js";
export declare function readInstrumentationSessionContext(context: AlsContext): {
    audience: "private" | "public" | "unknown";
    channel: import("../channel/adapter.ts").ChannelAdapter | undefined;
    conversation: import("#shared/conversation-context.js").ConversationContext;
    context: AlsContext;
    forwardedTracePolicy: import("#shared/forwarded-trace-policy.js").ForwardedTraceAssertion | undefined;
    instrumentation: import("../channel/instrumentation.ts").ChannelInstrumentationProjection | undefined;
    parent: import("#context/keys.js").SessionParent | undefined;
    parentLineage: import("./lifecycle.ts").InstrumentationParentLineage | undefined;
    parentTraceContext: import("#context/keys.js").SessionTraceSeed | undefined;
    principals: {
        readonly currentPrincipal?: import("./lifecycle.ts").InstrumentationPrincipalSummary;
        readonly initiatorPrincipal?: import("./lifecycle.ts").InstrumentationPrincipalSummary;
    };
    scheduleId: string | undefined;
    title: string | undefined;
    traceSeed: {
        traceFlags: number;
        decision?: import("../shared/instrumentation-decision.ts").InstrumentationDecision;
        forwardedTracePolicy?: import("#shared/forwarded-trace-policy.js").ForwardedTraceAssertion;
        spanId: string;
        traceId: string;
    } | undefined;
};
