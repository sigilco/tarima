import type { CompiledChannelDefinition, CompiledChannelRoutePlan } from "#compiler/manifest.js";
import type { AgentModuleBinding, AgentSourceDescriptor } from "#compiler/source-graph.js";
import { type CompilerDiagnostic } from "#compiler/diagnostics.js";
export declare function createCompiledChannelRoutePlan(input: {
    readonly bindings: Readonly<Record<string, AgentModuleBinding>>;
    readonly channels: readonly CompiledChannelDefinition[];
    readonly diagnostics?: CompilerDiagnostic[];
    readonly nodeId: string;
    readonly sources: Readonly<Record<string, AgentSourceDescriptor>>;
}): CompiledChannelRoutePlan;
/** A route's identity for matching: `/items/:id` and `/items/:itemId` are one route. */
export declare function normalizeRoutePattern(path: string): string;
