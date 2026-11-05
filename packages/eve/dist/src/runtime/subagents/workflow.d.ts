import type { WorkflowServeContext, WorkflowServeReceive } from "#public/tools/index.js";
/** The model's input to an agent tool; eve adds the optional `taskId`. */
export interface AgentToolInput {
    readonly message: string;
}
export interface AgentWithModelToolInput extends AgentToolInput {
    readonly model: string;
}
type AgentToolReceive = WorkflowServeReceive<AgentToolInput>;
type AgentWithModelToolReceive = WorkflowServeReceive<AgentWithModelToolInput>;
/**
 * The `serve` body of every agent tool: local, remote, dynamic, and the
 * `agent` copy of the root. Each task talks to one session with the agent. A
 * call that arrives while the agent works joins its turn, and the turn's final
 * response settles every call it answered.
 */
export declare function agentToolServeWorkflow(receive: AgentToolReceive, ctx: WorkflowServeContext<string>): Promise<never>;
/** The opt-in root-copy tool whose model-facing input selects the child model. */
export declare function agentWithModelServeWorkflow(receive: AgentWithModelToolReceive, ctx: WorkflowServeContext<string>): Promise<never>;
export {};
