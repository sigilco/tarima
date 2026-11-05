import type { WorkflowProgramContinuationSecurity } from "#execution/dynamic-workflow/schema.js";
/** Creates replay-stable signing material without exposing it to generated code. */
export declare function createWorkflowProgramContinuationSecurityStep(): Promise<WorkflowProgramContinuationSecurity>;
