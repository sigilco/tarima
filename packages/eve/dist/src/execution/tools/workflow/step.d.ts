import type { WorkflowStepInvocation } from "#execution/tools/workflow/step-context.js";
/** Wraps a step proxy only when the caller explicitly passes its workflow tool context. */
export declare function workflowToolStep(original: (...args: unknown[]) => Promise<unknown>, execute: (invocation: WorkflowStepInvocation) => Promise<unknown>): (...args: unknown[]) => Promise<unknown>;
