import { z } from "#compiled/zod/index.js";
/**
 * Eve-owned `tool-call` action requested by the model.
 *
 * Depending on the tool definition, it can execute locally, be provider
 * executed, or be handled later by the runtime.
 */
export type RuntimeToolCallActionRequest = z.infer<typeof runtimeToolCallActionRequestSchema>;
/**
 * Zod schema for one Eve-owned `tool-call` action request.
 */
export declare const runtimeToolCallActionRequestSchema: z.ZodObject<{
    callId: z.ZodString;
    input: z.ZodType<import("#shared/json.js").JsonObject, unknown, z.core.$ZodTypeInternals<import("#shared/json.js").JsonObject, unknown>>;
    kind: z.ZodLiteral<"tool-call">;
    toolName: z.ZodString;
}, z.core.$strict>;
export type RuntimeSubagentCallActionRequest = z.infer<typeof runtimeSubagentCallActionRequestSchema>;
declare const runtimeSubagentCallActionRequestSchema: z.ZodObject<{
    callId: z.ZodString;
    description: z.ZodString;
    input: z.ZodType<import("#shared/json.js").JsonObject, unknown, z.core.$ZodTypeInternals<import("#shared/json.js").JsonObject, unknown>>;
    kind: z.ZodLiteral<"subagent-call">;
    name: z.ZodString;
    nodeId: z.ZodString;
    subagentName: z.ZodString;
}, z.core.$strict>;
export type RuntimeRemoteAgentCallActionRequest = z.infer<typeof runtimeRemoteAgentCallActionRequestSchema>;
declare const runtimeRemoteAgentCallActionRequestSchema: z.ZodObject<{
    callId: z.ZodString;
    description: z.ZodString;
    input: z.ZodType<import("#shared/json.js").JsonObject, unknown, z.core.$ZodTypeInternals<import("#shared/json.js").JsonObject, unknown>>;
    kind: z.ZodLiteral<"remote-agent-call">;
    name: z.ZodString;
    nodeId: z.ZodString;
    remoteAgentName: z.ZodString;
}, z.core.$strict>;
export type RuntimeWorkflowToolCallActionRequest = z.infer<typeof runtimeWorkflowToolCallActionRequestSchema>;
declare const runtimeWorkflowToolCallActionRequestSchema: z.ZodObject<{
    callId: z.ZodString;
    input: z.ZodType<import("#shared/json.js").JsonObject, unknown, z.core.$ZodTypeInternals<import("#shared/json.js").JsonObject, unknown>>;
    kind: z.ZodLiteral<"workflow-tool-call">;
    toolName: z.ZodString;
    workflowId: z.ZodString;
}, z.core.$strict>;
/**
 * Internal subagent dispatch request issued by the agent workflow task.
 *
 * This is deliberately not a {@link RuntimeActionRequest}: subagent tools are
 * workflow tasks, while runtime actions are reserved for framework controls.
 */
export type RuntimeSubagentDispatchRequest = z.infer<typeof runtimeSubagentDispatchRequestSchema>;
/**
 * Zod schema for one internal local-subagent dispatch request.
 */
declare const runtimeSubagentDispatchRequestSchema: z.ZodObject<{
    callId: z.ZodString;
    description: z.ZodString;
    input: z.ZodType<import("#shared/json.js").JsonObject, unknown, z.core.$ZodTypeInternals<import("#shared/json.js").JsonObject, unknown>>;
    kind: z.ZodLiteral<"subagent-call">;
    name: z.ZodString;
    nodeId: z.ZodString;
    subagentName: z.ZodString;
}, z.core.$strict>;
/**
 * Internal remote-agent dispatch request issued by the agent workflow task.
 */
export type RuntimeRemoteAgentDispatchRequest = z.infer<typeof runtimeRemoteAgentDispatchRequestSchema>;
/**
 * Zod schema for one internal remote-agent dispatch request.
 */
export declare const runtimeRemoteAgentDispatchRequestSchema: z.ZodObject<{
    callId: z.ZodString;
    description: z.ZodString;
    input: z.ZodType<import("#shared/json.js").JsonObject, unknown, z.core.$ZodTypeInternals<import("#shared/json.js").JsonObject, unknown>>;
    kind: z.ZodLiteral<"remote-agent-call">;
    name: z.ZodString;
    nodeId: z.ZodString;
    remoteAgentName: z.ZodString;
}, z.core.$strict>;
/**
 * The entry point a new run invokes: `execute`, which the turn waits on, or
 * `task` or `serve`, with the id of the task the call's model step committed.
 */
export type WorkflowToolRunEntry = Exclude<WorkflowToolCallEntry, {
    readonly entryPoint: "receive";
}>;
/**
 * How a workflow tool call enters its tool's workflow: through the entry point of
 * a new run, or, for a call with `taskId` to a `serve` tool, through the
 * `receive()` of the running task that id names.
 */
export type WorkflowToolCallEntry = z.infer<typeof workflowToolCallEntrySchema>;
declare const workflowToolCallEntrySchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    entryPoint: z.ZodLiteral<"execute">;
}, z.core.$strict>, z.ZodObject<{
    entryPoint: z.ZodLiteral<"task">;
    taskId: z.ZodString;
}, z.core.$strict>, z.ZodObject<{
    entryPoint: z.ZodLiteral<"serve">;
    taskId: z.ZodString;
}, z.core.$strict>, z.ZodObject<{
    entryPoint: z.ZodLiteral<"receive">;
    taskId: z.ZodString;
}, z.core.$strict>], "entryPoint">;
/**
 * One workflow task requested by the harness. The turn owner starts the
 * durable run named by `workflowId`, or sends the call to the running task it
 * names; the turn waits for an `execute` call's result, while a call to a task
 * is answered with its receipt.
 *
 * Tasks are the coordination contract for authored workflow tools and
 * subagents. They are intentionally separate from `RuntimeActionRequest`.
 */
export type RuntimeWorkflowTaskRequest = z.infer<typeof runtimeWorkflowTaskRequestSchema>;
export declare const runtimeWorkflowTaskRequestSchema: z.ZodObject<{
    callId: z.ZodString;
    clearedBy: z.ZodOptional<z.ZodUnion<readonly [z.ZodObject<{
        policy: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        interactionId: z.ZodString;
    }, z.core.$strip>]>>;
    entry: z.ZodDiscriminatedUnion<[z.ZodObject<{
        entryPoint: z.ZodLiteral<"execute">;
    }, z.core.$strict>, z.ZodObject<{
        entryPoint: z.ZodLiteral<"task">;
        taskId: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        entryPoint: z.ZodLiteral<"serve">;
        taskId: z.ZodString;
    }, z.core.$strict>, z.ZodObject<{
        entryPoint: z.ZodLiteral<"receive">;
        taskId: z.ZodString;
    }, z.core.$strict>], "entryPoint">;
    executeInput: z.ZodOptional<z.ZodType<import("#shared/json.js").JsonValue, unknown, z.core.$ZodTypeInternals<import("#shared/json.js").JsonValue, unknown>>>;
    input: z.ZodType<import("#shared/json.js").JsonObject, unknown, z.core.$ZodTypeInternals<import("#shared/json.js").JsonObject, unknown>>;
    kind: z.ZodLiteral<"workflow-task">;
    toolName: z.ZodString;
    workflowId: z.ZodString;
}, z.core.$strict>;
/**
 * Eve-owned `load-skill` action requested by the model.
 */
type RuntimeLoadSkillActionRequest = z.infer<typeof runtimeLoadSkillActionRequestSchema>;
/**
 * Zod schema for one Eve-owned `load-skill` action request: the model's
 * `eve__skill` call, named for the skill it loads.
 */
declare const runtimeLoadSkillActionRequestSchema: z.ZodObject<{
    callId: z.ZodString;
    input: z.ZodType<import("#shared/json.js").JsonObject, unknown, z.core.$ZodTypeInternals<import("#shared/json.js").JsonObject, unknown>>;
    kind: z.ZodLiteral<"load-skill">;
    name: z.ZodString;
}, z.core.$strict>;
/**
 * Eve-owned action request surfaced by the harness.
 *
 * `tool-call` covers ordinary model-visible calls, including framework task
 * controls. Deferred workflow and subagent execution uses
 * {@link RuntimeWorkflowTaskRequest} instead.
 */
export type RuntimeActionRequest = RuntimeLoadSkillActionRequest | RuntimeRemoteAgentCallActionRequest | RuntimeSubagentCallActionRequest | RuntimeToolCallActionRequest | RuntimeWorkflowToolCallActionRequest;
/** Marks an in-process tool action without changing its serialized protocol shape. */
export declare function markRuntimeWorkflowToolAction(action: RuntimeToolCallActionRequest): RuntimeToolCallActionRequest;
/** Reads the in-process marker or the older explicit protocol action kind. */
export declare function isRuntimeWorkflowToolAction(action: RuntimeActionRequest): boolean;
/** Internal agent dispatch request owned by a workflow task. */
export type RuntimeAgentDispatchRequest = RuntimeRemoteAgentDispatchRequest | RuntimeSubagentDispatchRequest;
/**
 * Runtime-owned authored tool-result projected back into a harness resume call.
 */
export type RuntimeToolResultActionResult = z.infer<typeof runtimeToolResultActionResultSchema>;
/**
 * Zod schema for one runtime-owned authored tool-result action result.
 */
declare const runtimeToolResultActionResultSchema: z.ZodObject<{
    callId: z.ZodString;
    errorName: z.ZodOptional<z.ZodString>;
    isError: z.ZodOptional<z.ZodBoolean>;
    kind: z.ZodLiteral<"tool-result">;
    output: z.ZodType<import("#shared/json.js").JsonValue, unknown, z.core.$ZodTypeInternals<import("#shared/json.js").JsonValue, unknown>>;
    toolName: z.ZodString;
}, z.core.$strict>;
/**
 * Subagent result produced by a dispatched child session and delivered back
 * through the parent's resume hook.
 *
 * Results bind to the pending call by callId alone: possession of the
 * parent's callback token is the authorization to settle, so no further
 * identity verification happens here. Under the accepted at-least-once
 * dispatch window a replay-orphaned duplicate child holds the same token
 * and callId and may settle the call in place of the owned child — its
 * output is computed from the same input, and this is an accepted
 * trade-off, not an oversight.
 *
 * `outcome` is the child engine's explicit lifecycle verdict for the settled
 * turn. The run that opened the child reads the turn's status from `outcome`
 * and adds `outcome.usageDelta` to the running total it reports to its calling
 * session, which counts it once; `output`/`isError` remain the tool-result
 * projection shown to the model. Every producer states the envelope
 * explicitly, so the parent never infers lifecycle from an absent field.
 * `usage` carries the turn's token spend so the caller can attribute the
 * subagent's tokens.
 */
export interface RuntimeSubagentChildResult {
    readonly callId: string;
    readonly isError?: boolean;
    readonly kind: "subagent-result";
    readonly origin: "child";
    readonly outcome: import("#shared/agent-turn-outcome.js").AgentTurnOutcome;
    readonly output: import("#shared/json.js").JsonValue;
    readonly subagentName: string;
    readonly usage?: import("#shared/token-usage.js").TokenUsage;
}
/**
 * Subagent failure synthesized on the parent side when no child produced a
 * result. Always an error. Enters the harness only through the trusted
 * step-result path, never through the shared callback inbox.
 */
export type RuntimeSubagentDispatchFailure = z.infer<typeof runtimeSubagentDispatchFailureSchema>;
/**
 * Zod schema for one parent-synthesized subagent dispatch failure.
 */
declare const runtimeSubagentDispatchFailureSchema: z.ZodObject<{
    callId: z.ZodString;
    isError: z.ZodLiteral<true>;
    kind: z.ZodLiteral<"subagent-result">;
    origin: z.ZodLiteral<"dispatch">;
    output: z.ZodType<import("#shared/json.js").JsonValue, unknown, z.core.$ZodTypeInternals<import("#shared/json.js").JsonValue, unknown>>;
    subagentName: z.ZodString;
}, z.core.$strict>;
/**
 * Runtime-owned subagent result projected back into a harness resume call,
 * discriminated on `origin`: `child` results come from a dispatched child
 * session and must bind to a running agent handle; `dispatch` failures are
 * parent-synthesized and trusted by construction.
 */
export type RuntimeSubagentResult = RuntimeSubagentChildResult | RuntimeSubagentDispatchFailure;
/**
 * Runtime-owned action result produced by framework-owned loading code.
 */
type RuntimeLoadSkillActionResult = z.infer<typeof runtimeLoadSkillActionResultSchema>;
/**
 * Zod schema for one runtime-owned load-skill action result, named for the
 * skill its `load-skill` request loads.
 */
declare const runtimeLoadSkillActionResultSchema: z.ZodObject<{
    callId: z.ZodString;
    isError: z.ZodOptional<z.ZodBoolean>;
    kind: z.ZodLiteral<"load-skill-result">;
    name: z.ZodString;
    output: z.ZodType<import("#shared/json.js").JsonValue, unknown, z.core.$ZodTypeInternals<import("#shared/json.js").JsonValue, unknown>>;
}, z.core.$strict>;
/**
 * Runtime-owned action result produced by framework-owned runtime code.
 */
export type RuntimeActionResult = RuntimeLoadSkillActionResult | RuntimeSubagentResult | RuntimeToolResultActionResult;
export {};
