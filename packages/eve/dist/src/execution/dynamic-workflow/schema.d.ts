import { type JsonObject, type JsonValue } from "#shared/json.js";
export declare const DEFAULT_WORKFLOW_PROGRAM_MAX_SUBAGENTS = 100;
export declare const MAX_WORKFLOW_PROGRAM_MAX_SUBAGENTS = 128;
export declare const WORKFLOW_PROGRAM_BRIDGE_REQUEST_LIMIT = 256;
/** Size limit for the JSON text of each child reply a `ctx.agent()` call resolves to. */
export declare const WORKFLOW_PROGRAM_MAX_AGENT_OUTPUT_BYTES: number;
export interface WorkflowProgramContinuationSecurity {
    readonly maxAgeMs?: number;
    readonly signingKey: string;
}
/** Internal durable input pinned for one generated program run. */
export interface WorkflowProgramInput {
    readonly continuationSecurity: WorkflowProgramContinuationSecurity;
    readonly js: string;
    readonly maxSubagents: number;
}
export type WorkflowProgramOptions = Pick<WorkflowProgramInput, "maxSubagents">;
export interface WorkflowProgramAgentCall {
    readonly input: {
        readonly message: string;
        readonly outputSchema?: JsonObject;
    };
    readonly target: string;
}
/** One parked `ctx.agent()` call, keyed by its sandbox interruption id. */
export interface WorkflowProgramPendingCall {
    readonly call: WorkflowProgramAgentCall;
    readonly id: string;
}
export type WorkflowProgramCallResult = {
    readonly output: JsonValue;
    readonly status: "completed";
} | {
    readonly error: string;
    readonly status: "failed";
};
export interface WorkflowProgramResolution {
    readonly interruptionId: string;
    readonly value: WorkflowProgramCallResult;
}
export declare function parseWorkflowProgramOptions(value: unknown): WorkflowProgramOptions;
export declare function readWorkflowProgramAgentCall(value: unknown): WorkflowProgramAgentCall;
