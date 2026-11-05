import type { LocalSubagentSourceRef } from "#discover/manifest.js";
import type { NormalizedSubagentConfig } from "#compiler/normalize-subagent.js";
import type { AgentSourceRegistry } from "#compiler/source-graph.js";
export declare function resolveWorkspaceSubagentDefinition(input: {
    readonly definition: Extract<NormalizedSubagentConfig, {
        readonly kind: "remote";
    }>;
    readonly name: string;
    readonly registries: readonly AgentSourceRegistry[];
    readonly source: LocalSubagentSourceRef;
}): Promise<Extract<NormalizedSubagentConfig, {
    readonly kind: "remote";
}>>;
