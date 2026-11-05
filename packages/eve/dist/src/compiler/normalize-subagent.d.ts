import { type LocalSubagentSourceRef } from "#discover/manifest.js";
import type { AgentToolExposure } from "#shared/agent-definition.js";
export type NormalizedSubagentConfig = {
    readonly kind: "local";
    readonly definition: unknown;
} | {
    readonly kind: "dynamic";
} | {
    readonly description: string;
    readonly kind: "remote";
    readonly path: string;
    readonly tool?: AgentToolExposure;
    readonly url?: string;
};
export declare function normalizeSubagentConfig(value: unknown, message: string): NormalizedSubagentConfig;
export declare function assertRemoteAgentDefinitionHasNoLocalPackageEntries(source: LocalSubagentSourceRef): void;
