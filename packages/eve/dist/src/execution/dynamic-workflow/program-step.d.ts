import { type WorkflowProgramInput, type WorkflowProgramPendingCall, type WorkflowProgramResolution } from "#execution/dynamic-workflow/schema.js";
import { type JsonValue } from "#shared/json.js";
export type WorkflowProgramStepOutcome = {
    readonly output: JsonValue;
    readonly status: "completed";
} | {
    readonly continuation: string;
    readonly pending: readonly WorkflowProgramPendingCall[];
    readonly status: "interrupted";
};
interface WorkflowProgramStepInput {
    readonly callId: string;
    readonly program: WorkflowProgramInput;
    readonly resume?: {
        readonly continuation: string;
        readonly resolutions: readonly WorkflowProgramResolution[];
    };
}
/** Runs or resumes the side-effect-free JavaScript sandbox for one durable workflow. */
export declare function runWorkflowProgramStep(input: WorkflowProgramStepInput): Promise<WorkflowProgramStepOutcome>;
export {};
