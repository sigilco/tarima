import type { SessionAuth, SessionParent } from "#context/session-context.js";
import type { AgentSessionContext } from "#execution/agent-sessions/context.js";
import type { HarnessSessionBase } from "#harness/types.js";
import type { RuntimeToolResultActionResult, RuntimeWorkflowTaskRequest, WorkflowToolRunEntry } from "#shared/action-types.js";
import type { WorkflowToolRunAddress, WorkflowToolRunInput } from "#execution/tools/workflow/types.js";
import type { WorkflowToolRunOwner } from "#execution/tools/workflow/messages.js";
/** Starts a new run for each dispatch attempt. Call from a `"use step"` body. */
export declare function startWorkflowToolRun(input: Omit<WorkflowToolRunInput, "hookToken">): Promise<WorkflowToolRunAddress>;
/** Everything the session knows when it starts one workflow tool call's run. */
export interface StartWorkflowTaskInput {
    /** Captured for this call, as the context of the sessions opened for it. */
    readonly agentContext: AgentSessionContext;
    /** The caller's auth the session admits the call with. */
    readonly auth: SessionAuth;
    readonly batchEvent: {
        readonly sequence: number;
        readonly stepIndex: number;
        readonly turnId: string;
    };
    readonly owner: WorkflowToolRunOwner;
    readonly parentSession: SessionParent | undefined;
    /**
     * The call's run, when its batch already started it alongside the others.
     * The dispatch records it in place of starting one.
     */
    readonly prestarted?: PrestartedWorkflowToolRun;
    readonly session: HarnessSessionBase;
    readonly task: RuntimeWorkflowTaskRequest;
}
/** A call's run its batch started early, and the entry it was started with. */
export interface PrestartedWorkflowToolRun {
    readonly entry: WorkflowToolRunEntry;
    readonly run: Promise<WorkflowToolRunAddress>;
}
/** Starts the run for one call, which invokes `entry`. */
export declare function startWorkflowToolCallRun(input: StartWorkflowTaskInput, entry: WorkflowToolRunEntry): Promise<WorkflowToolRunAddress>;
/** Starts the run of an `execute` call the turn waits on and records it on the owning session. */
export declare function startWorkflowTask(input: StartWorkflowTaskInput): Promise<{
    readonly result?: RuntimeToolResultActionResult;
    readonly session: HarnessSessionBase;
}>;
/** The call's tool result when its run could not start. */
export declare function startFailureResult(task: RuntimeWorkflowTaskRequest, error: unknown): RuntimeToolResultActionResult;
