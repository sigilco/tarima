import type { ActiveOperation, AgentTelemetry, ExecutionContext } from "./types.js";
/** Runs `execute` exactly once, even when the telemetry cannot enter the context. */
export declare function runTraceContext<T>(telemetry: Pick<AgentTelemetry, "run" | "suppressed">, operation: ActiveOperation, execute: () => T, host?: ExecutionContext): T;
