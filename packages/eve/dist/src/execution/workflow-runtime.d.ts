import type { DispatchSessionInput, Runtime, SessionCommand, SessionCommandResult } from "#channel/types.js";
import { type Run, type StartOptionsWithoutDeploymentId, type WorkflowFunction, type WorkflowMetadata } from "#internal/workflow/runtime.js";
import type { RuntimeCompiledArtifactsSource } from "#runtime/compiled-artifacts-source.js";
import type { AgentSessionRuntimeOverrides } from "#execution/agent-sessions/runtime-overrides.js";
import type { DynamicSubagentAgentConfig } from "#runtime/subagents/dynamic-agent-config.js";
interface WorkflowHookRecord {
    readonly runId: string;
}
/**
 * Stable workflow reference used by `start()` to locate the workflow
 * entrypoint registered by the Workflow DevKit builder. The id omits
 * the package version stamp so the long-lived owner can rotate across
 * deployments without rewriting the registry key.
 */
export declare const workflowEntryReference: {
    workflowId: string;
};
/** Stable workflow reference for session deadline timers. */
export declare const sessionTimeoutWorkflowReference: {
    workflowId: string;
};
/** Stable workflow reference for authored workflow tool runs. */
export declare const workflowToolRunWorkflowReference: {
    workflowId: string;
};
export declare const connectionEventWorkflowReference: {
    workflowId: string;
};
export declare const connectionEventDeliveryWorkflowReference: {
    workflowId: string;
};
/**
 * Creates a workflow-backed runtime whose current owner executes turns and
 * whose original run retains the public event stream across owner handoffs.
 */
export declare function createWorkflowRuntime(config: {
    readonly agentSessionRuntimeOverrides?: AgentSessionRuntimeOverrides;
    readonly compiledArtifactsSource: RuntimeCompiledArtifactsSource;
    readonly dynamicSubagentAgentConfig?: DynamicSubagentAgentConfig;
    readonly nodeId?: string;
}): Runtime;
/**
 * Sends one command to a session through its stable command inbox. A caller
 * holding the session id asked for that exact session, so a send to a
 * stranded one is refused rather than replaced.
 */
export declare function dispatchWorkflowSessionCommand<TCommand extends SessionCommand>(input: DispatchSessionInput<TCommand>): Promise<SessionCommandResult<TCommand>>;
/** The session holding a continuation token's inbox, if any does. */
export declare function resolveContinuation(continuationToken: string, options?: {
    readonly runnable?: boolean;
}): Promise<{
    sessionId: string;
} | undefined>;
/**
 * Resolves hook ownership for replay-idempotent work already running inside a
 * durable step. Request handlers must return from start/resume acceptance and
 * leave ownership arbitration to the workflow.
 */
export declare function waitForCommandHookOwner(token: string): Promise<WorkflowHookRecord>;
/**
 * Waits until a started session claims its inbox, which it does when its run
 * first suspends. Resolves `false` when the run ended without an inbox, so
 * there is nothing left to command.
 */
export declare function waitForSessionInbox(sessionId: string): Promise<boolean>;
/**
 * Calls `check` until it returns a value, backing off from 20 ms to 200 ms
 * between calls, and resolves `undefined` once `timeoutMs` passes without one.
 */
export declare function pollUntil<T>(check: () => Promise<T | undefined>, timeoutMs: number): Promise<T | undefined>;
/** A run `start()` accepted may not be readable yet, which is not an ended run. */
export declare function hasRunEnded(runId: string): Promise<boolean>;
/** Starts a workflow on the deployment executing this call. */
export declare function startWorkflowOnCurrentDeployment<TArgs extends unknown[], TResult>(workflow: WorkflowFunction<TArgs, TResult> | WorkflowMetadata, args: TArgs, options?: StartOptionsWithoutDeploymentId): Promise<Run<unknown> | Run<TResult>>;
/**
 * Starts a run on an exact deployment. Every run eve starts records the eve
 * version that started it: ingress and the stranded replay guard read it to
 * decide whether this build can still execute the run.
 */
export declare function startWorkflowOnDeployment<TArgs extends unknown[], TResult>(workflow: WorkflowFunction<TArgs, TResult> | WorkflowMetadata, args: TArgs, deploymentId: string, options?: StartOptionsWithoutDeploymentId): Promise<Run<unknown> | Run<TResult>>;
export {};
