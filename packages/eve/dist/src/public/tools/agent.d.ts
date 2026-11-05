import { type AgentWithModelToolInput } from "#runtime/subagents/workflow.js";
import { agent } from "#tools/framework/agent.js";
import { type WorkflowServeToolDefinition } from "#tools/workflow-definition.js";
export { agent, agent as default };
export type { AgentWithModelToolInput };
export type AgentWithModelTool = WorkflowServeToolDefinition<AgentWithModelToolInput, unknown>;
/** Root-copy agent tool whose model-facing input selects the model for each new task. */
export declare const agentWithModel: AgentWithModelTool;
