import type { CaptureDecision, TraceReference } from "./types.js";
export interface AgentHandoff {
    readonly caller: TraceReference;
    readonly conversationId: string;
    readonly parentRunId: string;
    readonly parentCallId: string;
    readonly agentName: string;
    readonly capture: CaptureDecision;
    /** Set when the handoff crossed a process boundary; the callee then starts its own trace. */
    readonly remote?: boolean;
}
export declare const currentAgentHandoff: () => AgentHandoff | undefined;
export declare function withAgentHandoff<T>(handoff: AgentHandoff, execute: () => T): T;
