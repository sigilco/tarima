import type { HarnessToolDefinition } from "#harness/execute-tool.js";
import type { WorkflowToolEntryPoint } from "#tools/workflow-entry-point.js";
/**
 * The entry point a workflow tool's calls run through. Every agent tool is a
 * `serve` tool; tools that dispatch nowhere are called like `execute`.
 */
export declare function entryPointOf(definition: HarnessToolDefinition | undefined): WorkflowToolEntryPoint;
/** Whether calls to the tool run as tasks: every call to an agent, `task`, or `serve` tool. */
export declare function startsTasks(definition: HarnessToolDefinition | undefined): boolean;
/** Whether the tool is an agent: a declared, remote, dynamic, or root-copy agent. */
export declare function isAgentTool(definition: HarnessToolDefinition | undefined): boolean;
