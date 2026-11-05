export { runAgentRouterTask } from "#execution/tools/agent-router-workflow.js";
export declare const AGENT_ROUTER_TOOL_DESCRIPTION = "Route a task to the best available subagent based on each subagent's declared description.";
export interface AgentRouterInput {
    readonly message: string;
}
export declare const AGENT_ROUTER_INPUT_SCHEMA: import("#tools/schema.js").ToolSchema<AgentRouterInput, AgentRouterInput>;
