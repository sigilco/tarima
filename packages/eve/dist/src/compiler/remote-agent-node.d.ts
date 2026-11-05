import { z } from "#compiled/zod/index.js";
import type { Node } from "#shared/node.js";
import type { ModuleSourceRef } from "#shared/source-ref.js";
import type { AgentSourceOwner, CompiledModuleBinding } from "#compiler/source-graph.js";
import type { AgentToolExposure } from "#shared/agent-definition.js";
export type CompiledDynamicSubagentDefinition = Readonly<ModuleSourceRef>;
/**
 * Remote subagent entry owned by one compiled agent node manifest. Like
 * channels, remote subagents are node-local manifest entries rather than a
 * separate graph-level list.
 */
export type CompiledRemoteAgentNode = Readonly<ModuleSourceRef & Node & {
    description: string;
    backing: {
        readonly kind: "resource";
        readonly sourcePath: string;
    };
    binding: CompiledModuleBinding;
    entryPath: string;
    name: string;
    owner: AgentSourceOwner;
    parentNodeId: string;
    path: string;
    rootPath: string;
    tool?: AgentToolExposure;
    url?: string;
}>;
/**
 * Zod schema for one compiled remote subagent entry.
 */
export declare const compiledRemoteAgentNodeSchema: z.ZodType<CompiledRemoteAgentNode>;
