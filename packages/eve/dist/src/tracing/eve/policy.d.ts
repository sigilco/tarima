import type { InstrumentationEvent, InstrumentationScope } from "#instrumentation/lifecycle.js";
import type { AgentTraceStateStore } from "#tracing/eve/agent-trace-state.js";
import type { ConversationEnvironment } from "#shared/conversation-context.js";
export declare function createEveCapturePolicy(input: {
    readonly stateStore: AgentTraceStateStore;
    readonly environment: ConversationEnvironment;
    readonly recordInputs: boolean;
    readonly recordOutputs: boolean;
}): {
    projectEvent(event: InstrumentationEvent): Promise<InstrumentationEvent>;
    forOperation(scope: Pick<InstrumentationScope, "sessionId" | "channelAudience">): Promise<{
        recordInputs: boolean;
        recordOutputs: boolean;
    }>;
};
