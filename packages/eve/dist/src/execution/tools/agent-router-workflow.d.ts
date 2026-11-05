import type { JsonValue } from "#shared/json.js";
import type { WorkflowToolContext } from "#tools/workflow-definition.js";
import type { AgentRouterInput } from "#execution/tools/agent-router.js";
/** Routes one task through the complete workflow agent metadata snapshot. */
export declare function runAgentRouterTask(input: AgentRouterInput, ctx: WorkflowToolContext): Promise<JsonValue>;
