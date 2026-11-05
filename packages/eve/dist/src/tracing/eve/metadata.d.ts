import type { AgentSessionTraceState, AgentTurnTraceState } from "#tracing/eve/agent-trace-state.js";
import type { TurnInput } from "#compiled/@vercel/agent-runs/index.js";
export declare function eveActivationMetadata(input: {
    readonly session?: AgentSessionTraceState;
    readonly turn: AgentTurnTraceState;
    readonly sessionId: string;
}): Pick<TurnInput, "sequence" | "lineage" | "channel" | "attributes">;
