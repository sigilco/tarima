import type { SessionContext } from "#context/session-context.js";
import type { AgentSessionContext } from "#execution/agent-sessions/context.js";
import { type RunUsageTally } from "#execution/agent-sessions/usage.js";
import type { InstrumentationChannel } from "#shared/instrumentation-channel.js";
import type { WorkflowSharedContext } from "#tools/workflow-definition.js";
import { WorkflowToolRunAsks } from "#execution/tools/workflow/ask.js";
import type { WorkflowBodyCommand, WorkflowToolRunOutcome, WorkflowToolRunRef } from "#execution/tools/workflow/messages.js";
import type { WorkflowToolRunInbox } from "#execution/tools/workflow/owner.js";
import type { WorkflowToolRunEntry } from "#shared/action-types.js";
import { type JsonObject, type JsonValue } from "#shared/json.js";
import type { ToolContext } from "#tools/definition.js";
export interface WorkflowBodyDefinition {
    /** Everything the run needs to open `ctx.agent` sessions for its caller, and `ctx.agents`. */
    readonly agentContext: AgentSessionContext;
    readonly callId: string;
    /** The entry point the run invokes, which decides the body's context. */
    readonly entry: WorkflowToolRunEntry;
    readonly executeInput?: JsonValue;
    readonly input: JsonObject;
    readonly session: SessionContext["session"];
    readonly stepIndex: number;
    readonly toolName: string;
    readonly workflowId: string;
}
export interface WorkflowBodyInput extends WorkflowBodyDefinition {
    /** The run's control hook, which the session answers the body's questions on. */
    readonly hookToken: string;
    readonly owner: WorkflowToolRunInbox;
    readonly runId?: string;
}
/**
 * How the session's commands reach a running body. What a command means
 * depends on the entry point: a cancel ends an `execute` or `task` call, but
 * only the current stretch of work of a `serve` task.
 */
export interface WorkflowBodyControl {
    /** Aborts when the run stops for good; the run then settles as cancelled. */
    readonly runSignal: AbortSignal;
    /** The body is winding down cancelled work, which the run bounds with its cleanup deadline. */
    readonly unwinding: boolean;
    apply(command: WorkflowBodyCommand): void;
}
/** A body the run started and how its commands reach it. */
export interface StartedWorkflowBody {
    /** The body's pending questions, which the session's decisions settle. */
    readonly asks: WorkflowToolRunAsks;
    /** Releases what the body opened, such as its `ctx.agent` sessions, once the run ends. */
    close(): Promise<void>;
    readonly control: WorkflowBodyControl;
    readonly outcome: Promise<WorkflowToolRunOutcome>;
    /** What the body's `ctx.agent` sessions spent, which the run's outcome carries. */
    readonly usage: RunUsageTally;
}
/** Starts the body of an `execute` or `task` call, which serves the call the run started with. */
export declare function startCallBody(input: WorkflowBodyInput): StartedWorkflowBody;
/**
 * An authored result as the run's JSON outcome, parsed the way a local tool's
 * result is: undefined properties are omitted, a missing result is `null`,
 * and a value JSON can't carry throws, failing the run.
 */
export declare function toWorkflowOutput(call: {
    readonly callId: string;
    readonly toolName: string;
}, output: unknown): JsonValue;
/** A body's failure, or its cancellation when the run stopped. */
export declare function toFailedOutcome(error: unknown, runSignal: AbortSignal): WorkflowToolRunOutcome;
export declare function createWorkflowBodyRef(input: WorkflowBodyDefinition & {
    readonly runId?: string;
}): WorkflowToolRunRef;
export declare function resolveWorkflowEntryPoint<TEntryPoint>(input: WorkflowBodyInput): TEntryPoint;
/**
 * The members every entry point's context shares, bound to the run. `ask`
 * is the entry point's own, since what it may ask for depends on its calls.
 * The members that describe a call, `abortSignal`, `agents`, `callId`, and
 * `session` (whose turn is the call's), come from the entry point, which
 * knows its calls.
 */
export declare function createSharedContext(input: WorkflowBodyInput, agent: WorkflowSharedContext["agent"], askPerson: WorkflowSharedContext["ask"]): Omit<ToolContext & WorkflowSharedContext, "abortSignal" | "agents" | "callId" | "messages" | "session">;
/** `ctx.channel` for a call: the channel that serves the calling session. */
export declare function workflowToolChannel(context: AgentSessionContext): InstrumentationChannel;
/** `ctx.agents` for a call: the agents its context lists, frozen. */
export declare function createAgentsView(context: AgentSessionContext): WorkflowSharedContext["agents"];
export declare class WorkflowToolRunCancelledError extends Error {
    constructor(reason: string);
}
/** Why an `execute` call's `abortSignal` aborted when a steering message arrived. */
export declare class WorkflowToolRunInterruptedError extends Error {
    constructor();
}
