import type { InstrumentationMemoryExecutionOperation } from "#instrumentation/memory.js";
import type { ConversationEnvironment } from "#shared/conversation-context.js";
import type { AgentTraceStateStore } from "#tracing/eve/agent-trace-state.js";
import { type AgentRun } from "#compiled/@vercel/agent-runs/index.js";
export declare function createAgentMemoryInstrumentation(input: {
    tracing: AgentRun;
    environment: ConversationEnvironment;
    recordOutputs?: boolean;
    stateStore: AgentTraceStateStore;
}): {
    runInContext<T>(operation: InstrumentationMemoryExecutionOperation, execute: () => PromiseLike<T>): Promise<T>;
};
