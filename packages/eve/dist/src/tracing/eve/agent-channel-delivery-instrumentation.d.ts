import type { InstrumentationProviderDefinition } from "#instrumentation/lifecycle.js";
import type { AgentTraceStateStore } from "#tracing/eve/agent-trace-state.js";
/** Attribute a turn only when exactly one message delivery was consumed, across workers. */
export declare function createAgentChannelDeliveryInstrumentation(input: {
    readonly recordInputs: boolean;
    readonly stateStore: AgentTraceStateStore;
}): Pick<NonNullable<InstrumentationProviderDefinition["events"]>, "delivery.consumed">;
