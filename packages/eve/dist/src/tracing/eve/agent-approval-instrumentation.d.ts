import type { InstrumentationProviderDefinition } from "#instrumentation/lifecycle.js";
import type { AgentActionTraceState } from "#tracing/eve/agent-trace-state.js";
import type { AgentRun } from "#compiled/@vercel/agent-runs/index.js";
/** Approval spans live under their tool call; hook state keeps only the locator. */
export declare function createAgentApprovalInstrumentation(input: {
    readonly tracing: AgentRun;
    readonly actionStateFor: (sessionId: string, turnId: string, callId: string) => Promise<AgentActionTraceState | undefined>;
}): Pick<NonNullable<InstrumentationProviderDefinition["events"]>, "interaction.opened" | "interaction.settled">;
