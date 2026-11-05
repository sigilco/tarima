import { type StartedWorkflowBody, type WorkflowBodyInput } from "#execution/tools/workflow/body.js";
/** Starts a `serve` body, which runs once for its task and serves every call to it. */
export declare function startServeBody(input: WorkflowBodyInput): StartedWorkflowBody;
