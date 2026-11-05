import type { StepFn, KernelConfig } from "#harness/types.js";
/**
 * Creates the harness step: one step of a session, backed by the AI SDK's `ToolLoopAgent`.
 *
 * A step settles what earlier steps parked and takes its delivery's answers, opens or joins the
 * turn, runs the work those answers approved, then makes one model step and acts on its response.
 * Every lifecycle change goes through the session machine (`Step.apply`).
 */
export declare function createKernel(config: KernelConfig): StepFn;
