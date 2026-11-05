import { type WorkflowStepInvocation } from "#execution/tools/workflow/step-context.js";
/** Keeps token capabilities and bearer values inside the executing step. */
export declare function withWorkflowStepAuthorization(execute: (...args: never[]) => unknown): (this: unknown, invocation: WorkflowStepInvocation) => Promise<unknown>;
