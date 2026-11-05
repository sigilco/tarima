import type { ContextReader } from "#context/key.js";
import type { WorkflowAgentMetadata } from "#tools/workflow-definition.js";
/** Snapshots callable agent metadata for one workflow tool run. */
export declare function resolveWorkflowAgentMetadata(ctx: ContextReader): Readonly<Record<string, WorkflowAgentMetadata>>;
