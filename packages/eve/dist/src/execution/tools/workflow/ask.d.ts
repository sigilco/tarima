import type { SessionAuth } from "#context/session-context.js";
import type { AgentSessionContext } from "#execution/agent-sessions/context.js";
import type { WorkflowToolRunAskDecision, WorkflowToolRunRef } from "#execution/tools/workflow/messages.js";
import type { WorkflowToolRunInbox } from "#execution/tools/workflow/owner.js";
import type { ToolContext, ToolQuestion, ToolAskOptions, ToolAnswer } from "#tools/definition.js";
/**
 * The run a workflow body belongs to. Members that describe a call describe
 * the one the run serves now, which a `serve` task changes with each call, so
 * read them when they are used.
 */
export interface WorkflowToolRunContext {
    /**
     * What the call's caller lends it: the lineage a `ctx.agent` session opened
     * now binds, and whether `ctx.ask()` can reach a person.
     */
    readonly agentContext: AgentSessionContext;
    readonly asks: WorkflowToolRunAsks;
    /** The auth of the call, which a message sent to a `ctx.agent` session now carries. */
    readonly auth: SessionAuth;
    /** The run's control hook, where the session sends its decisions on the run's questions. */
    readonly control: string;
    /**
     * The ref of the call the run serves now, which questions and sign-ins come
     * from. A `serve` task's changes with each call, so read it when sending.
     */
    readonly from: WorkflowToolRunRef;
    readonly owner: WorkflowToolRunInbox;
}
export declare function attachWorkflowToolRunContext(ctx: Pick<ToolContext, "abortSignal">, context: WorkflowToolRunContext): void;
export declare function findWorkflowToolRunContext(value: unknown): WorkflowToolRunContext | undefined;
/**
 * The run's pending `ctx.ask()` questions. The run names each one, and each
 * resolves only from what the session decided about it, delivered in order on
 * the run's control hook, or as `cancelled` once the session stops the work.
 */
export declare class WorkflowToolRunAsks {
    private opened;
    private readonly pending;
    /** Withdrawal requests on their way to the run's inbox. */
    private readonly withdrawing;
    private readonly runId;
    constructor(runId: string);
    /**
     * Opens a question under a request ID that replays deterministically with
     * the run. `send` sends the request and returns how to send its withdrawal.
     */
    open(send: (requestId: string) => () => Promise<void>): {
        readonly answer: Promise<ToolAnswer>;
        readonly requestId: string;
    };
    /**
     * Asks the session to withdraw a pending question, at most once. The
     * question stays pending until the session decides it, so an answer the
     * session accepted first still wins.
     */
    withdraw(requestId: string): void;
    /** Asks the session to withdraw every pending question not already withdrawn. */
    withdrawAll(): void;
    /**
     * Waits until every withdrawal asked for has reached the run's inbox, so the
     * session decides each one before the run's outcome withdraws the rest.
     */
    flush(): Promise<void>;
    /** Applies the session's decision. The first one wins; a repeated one is dropped. */
    settle(decision: WorkflowToolRunAskDecision): void;
    /** The session stopped the work, so it answers none of its questions anymore. */
    cancelAll(): void;
    private take;
}
/**
 * Returns an answer which may be awaited or raced with another workflow
 * operation. When the call's `abortSignal` or `options.signal` aborts, the run
 * asks the session to withdraw the question. The answer is `cancelled` only if
 * the session withdrew it before it accepted a person's answer.
 */
export declare function ask(ctx: Pick<ToolContext, "abortSignal">, request: ToolQuestion, options?: ToolAskOptions): Promise<ToolAnswer>;
