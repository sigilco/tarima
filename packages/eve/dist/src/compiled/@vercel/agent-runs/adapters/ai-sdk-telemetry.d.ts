import type { Telemetry } from "ai";
import type { AgentRun, TurnInput } from "../agent-run.js";
export interface AiSdkTelemetryOptions {
    /** The turn a generation records. Called once per AI SDK call. */
    readonly turn: TurnInput | ((call: {
        readonly callId: string;
    }) => TurnInput);
}
/**
 * An AI SDK telemetry integration that records each generation as a turn.
 * Pass it to `telemetry.integrations` of `generateText`, `streamText`, or an
 * agent such as `HarnessAgent`.
 */
export declare function aiSdkTelemetry(run: AgentRun, options: AiSdkTelemetryOptions): Telemetry;
