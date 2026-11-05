import { z } from "#compiled/zod/index.js";
import { type DiscoverDiagnosticsSummary } from "#discover/diagnostics.js";
import { type CompiledDynamicSubagentDefinition, type CompiledRemoteAgentNode } from "#compiler/remote-agent-node.js";
import type { ChannelRouteMethod } from "#public/definitions/channel.js";
import type { NormalizedChannelCorsOptions } from "#channel/cors.js";
import type { InternalInstructionsDefinition } from "#shared/instructions-definition.js";
import type { JsonObject } from "#shared/json.js";
import type { Node } from "#shared/node.js";
import type { MarkdownSourceRef, ModuleSourceRef, SkillPackageSourceRef } from "#shared/source-ref.js";
import type { NamedSkillDefinition } from "#shared/skill-definition.js";
import { type InternalAgentDefinition, type InternalAgentModelDefinition, type InternalAgentCompactionDefinition, type ModelRouting } from "#shared/agent-definition.js";
import type { VercelConnectMetadata } from "#shared/vercel-connect-metadata.js";
import type { InternalToolDefinition } from "#tools/definition.js";
import type { CompiledToolBehavior } from "#tools/behavior.js";
import type { AgentSourceComposition, AgentSourceDescriptor, AgentSourceOwner, CompiledModuleBinding } from "#compiler/source-graph.js";
/**
 * Stable manifest kind emitted by the compiler for runtime loading.
 */
export declare const COMPILED_AGENT_MANIFEST_KIND = "eve-agent-compiled-manifest";
/**
 * Stable node id used by compiled artifacts for the root authored agent.
 */
export declare const ROOT_COMPILED_AGENT_NODE_ID = "__root__";
/**
 * Current compiled manifest schema version.
 */
export declare const COMPILED_AGENT_MANIFEST_VERSION = 56;
/**
 * Active compiled channel entry — backed by an authored `Channel` module.
 */
export interface CompiledChannelDefinition {
    readonly kind: "channel";
    readonly name: string;
    readonly logicalPath: string;
    readonly method: ChannelRouteMethod;
    readonly urlPath: string;
    readonly sourceId: string;
    readonly sourceKind: "module";
    readonly exportName?: string;
    /**
     * Stable identifier of the `ChannelAdapter.kind` returned by the authored
     * route, captured at compile time. Examples: `"slack"`, `"http"`. Authors
     * may override the default kind on their adapter, so this field is the
     * adapter's reported value verbatim. Consumers (eg. dashboard surfaces)
     * normalize it for display via {@link normalizeChannelKindForDisplay}.
     *
     * Omitted when the route does not register an adapter.
     */
    readonly adapterKind?: string;
    /**
     * Serializable CORS options to apply to this channel route. Omitted when the
     * channel leaves CORS untouched.
     */
    readonly cors?: NormalizedChannelCorsOptions;
    readonly manifest?: JsonObject;
    readonly vercelConnect?: VercelConnectMetadata;
}
/**
 * Disabled compiled channel entry — marker that an authored file at this
 * slug exported `disableRoute()` to remove the matching framework default.
 */
export interface CompiledChannelPreflightDefinition {
    readonly cors: NormalizedChannelCorsOptions;
    readonly method: "OPTIONS";
    readonly sourceIds: readonly string[];
    readonly urlPath: string;
}
export interface CompiledShadowedChannelRoute {
    readonly method: ChannelRouteMethod;
    readonly source: AgentSourceDescriptor;
    readonly urlPath: string;
    readonly winnerSourceId: string;
}
export interface CompiledChannelRoutePlan {
    readonly effective: readonly CompiledChannelDefinition[];
    readonly preflight: readonly CompiledChannelPreflightDefinition[];
    readonly shadowed: readonly CompiledShadowedChannelRoute[];
}
/**
 * Serializable runtime model reference preserved in the compiled manifest.
 *
 * Carries {@link ModelRouting} — decided at compile time from the authored model
 * value — so consumers (the dev server's `/eve/v1/info`, the TUI) can tell how
 * the model is reached without re-resolving it. Runtime model resolution uses
 * the routing-free {@link InternalAgentModelDefinition}; routing is a
 * compiled-output concern only.
 */
export type CompiledRuntimeModelReference = InternalAgentModelDefinition & {
    routing: ModelRouting;
};
/**
 * Dynamic model resolver source preserved in the compiled manifest.
 */
export type CompiledDynamicModelDefinition = ModuleSourceRef;
/**
 * Normalized authored compaction configuration preserved in the compiled
 * manifest.
 */
type CompiledAgentCompactionDefinition = Omit<InternalAgentCompactionDefinition, "model"> & {
    model?: CompiledRuntimeModelReference;
};
/**
 * Normalized additive agent configuration preserved in the compiled manifest.
 */
type CompiledAgentDefinitionBase = Omit<InternalAgentDefinition, "model" | "compaction"> & {
    compaction?: CompiledAgentCompactionDefinition;
    source: ModuleSourceRef;
};
export type CompiledAgentDefinition = CompiledAgentDefinitionBase & ({
    readonly model: CompiledRuntimeModelReference;
    readonly dynamicModel?: never;
} | {
    readonly model?: never;
    readonly dynamicModel: CompiledDynamicModelDefinition;
});
/**
 * Normalized authored instructions prompt preserved in the compiled
 * manifest.
 */
export type CompiledInstructionsDefinition = InternalInstructionsDefinition & ((Omit<MarkdownSourceRef<undefined>, "definition"> & {
    readonly owner: AgentSourceOwner;
}) | Omit<ModuleSourceRef, "exportName">);
/**
 * Normalized authored skill preserved in the compiled manifest.
 */
export type CompiledSkillDefinition = NamedSkillDefinition & ((Omit<MarkdownSourceRef<undefined>, "definition"> & {
    readonly owner: AgentSourceOwner;
}) | ModuleSourceRef | (SkillPackageSourceRef & {
    readonly owner: AgentSourceOwner;
}));
/**
 * Normalized authored schedule preserved in the compiled manifest.
 */
export type CompiledScheduleDefinition = z.infer<typeof compiledScheduleDefinitionSchema>;
export type CompiledScheduleCollectionDefinition = z.infer<typeof compiledScheduleCollectionDefinitionSchema>;
/**
 * Normalized authored sandbox metadata preserved in the compiled manifest.
 */
export type CompiledSandboxDefinition = z.infer<typeof compiledSandboxDefinitionSchema>;
/**
 * Compiled sandbox workspace folder preserved in the compiled manifest.
 *
 * Corresponds to the `agent/sandbox/workspace/` directory discovered on
 * disk. Mounted into the live sandbox cwd at session bootstrap.
 */
type CompiledSandboxWorkspace = z.infer<typeof compiledSandboxWorkspaceSchema>;
/**
 * Byte-free descriptor for the compiled workspace resource tree owned by one
 * graph node.
 */
export type CompiledWorkspaceResourceRoot = z.infer<typeof compiledWorkspaceResourceRootSchema>;
/**
 * Normalized authored connection metadata preserved in the compiled manifest.
 */
export type CompiledConnectionDefinition = z.infer<typeof compiledConnectionDefinitionSchema>;
/**
 * Normalized authored tool metadata preserved in the compiled manifest.
 */
export type CompiledToolDefinition = InternalToolDefinition & ModuleSourceRef & {
    readonly behavior?: CompiledToolBehavior;
    readonly hasExecute: boolean;
    readonly hasModelOutputProjection: boolean;
    /** The input schema as eve sends it to a model; absent for provider-managed tools. */
    readonly modelInputSchema?: JsonObject;
    readonly requiresApproval: boolean;
    readonly workflowProgram?: {
        readonly maxSubagents: number;
    };
};
/** The kinds of file eve asks at runtime, each a definition of the agent's. */
export type CompiledDefinitionKind = "connection" | "hook" | "instructions" | "memory" | "skill" | "tool";
/**
 * A file the agent declares that eve asks at runtime: a `defineDynamic()` tool, skill,
 * connection, or instructions file, a hook, or a memory. Its module holds the code; this holds
 * what reading the agent needs without loading it.
 */
export interface CompiledDefinition extends ModuleSourceRef {
    readonly kind: CompiledDefinitionKind;
    /** Its name, from its path: `tools/weather.ts` is `"weather"`, `memory/notes.ts` `"notes"`. */
    readonly slug: string;
    /** An extension's namespace, which the names of what a map returns take. */
    readonly extensionNamespace?: string;
    /** A hook's events. */
    readonly eventNames?: readonly string[];
    /** A memory's description. */
    readonly description?: string;
}
/** A node's definitions of one kind, in the order it declares them. */
export declare function compiledOf(node: {
    readonly definitions: readonly CompiledDefinition[];
}, kind: CompiledDefinitionKind): readonly CompiledDefinition[];
/**
 * Non-recursive compiled authored agent payload shared by the root agent and
 * every flattened subagent node.
 */
export type CompiledAgentNodeManifest = z.infer<typeof compiledAgentNodeManifestSchema>;
export type CompiledAgentResources = z.infer<typeof compiledAgentResourcesSchema>;
export type CompiledSubagentNode = Readonly<ModuleSourceRef & Node & {
    backing: {
        readonly kind: "resource";
        readonly sourcePath: string;
    };
    entryPath: string;
    name: string;
    owner: AgentSourceOwner;
    parentNodeId: string;
    rootPath: string;
} & ({
    agent: CompiledAgentNodeManifest;
    configResolver?: never;
    description: string;
} | {
    agent: CompiledAgentResources;
    configResolver: CompiledDynamicSubagentDefinition;
    description?: never;
})>;
export type { CompiledRemoteAgentNode } from "#compiler/remote-agent-node.js";
/**
 * Versioned compiled manifest emitted by the compiler and loaded by runtime.
 */
export type CompiledAgentManifest = z.infer<typeof compiledAgentManifestSchema>;
declare const compiledScheduleDefinitionSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    cron: z.ZodString;
    hasRun: z.ZodBoolean;
    name: z.ZodString;
    logicalPath: z.ZodString;
    markdown: z.ZodOptional<z.ZodString>;
    sourceId: z.ZodString;
    owner: z.ZodType<AgentSourceOwner, unknown, z.core.$ZodTypeInternals<AgentSourceOwner, unknown>>;
    sourceKind: z.ZodLiteral<"markdown">;
}, z.core.$strict>, z.ZodObject<{
    cron: z.ZodString;
    hasRun: z.ZodBoolean;
    name: z.ZodString;
    logicalPath: z.ZodString;
    markdown: z.ZodOptional<z.ZodString>;
    sourceId: z.ZodString;
    sourceKind: z.ZodLiteral<"module">;
}, z.core.$strict>], "sourceKind">;
declare const compiledScheduleCollectionDefinitionSchema: z.ZodObject<{
    application: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    logicalPath: z.ZodString;
    name: z.ZodString;
    providerKind: z.ZodString;
    sourceId: z.ZodString;
    sourceKind: z.ZodLiteral<"module">;
    tools: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodLiteral<"deferred">]>>;
}, z.core.$strict>;
declare const compiledSandboxDefinitionSchema: z.ZodObject<{
    providerName: z.ZodOptional<z.ZodString>;
    environmentExportName: z.ZodOptional<z.ZodString>;
    inheritsParent: z.ZodOptional<z.ZodBoolean>;
    exportName: z.ZodOptional<z.ZodString>;
    logicalPath: z.ZodString;
    revisionHash: z.ZodString;
    sourceId: z.ZodString;
    sourceKind: z.ZodLiteral<"module">;
}, z.core.$strict>;
declare const compiledSandboxWorkspaceSchema: z.ZodObject<{
    logicalPath: z.ZodString;
    rootEntries: z.ZodReadonly<z.ZodArray<z.ZodString>>;
    sourceId: z.ZodString;
    sourcePath: z.ZodString;
}, z.core.$strict>;
declare const compiledWorkspaceResourceRootSchema: z.ZodObject<{
    contentHash: z.ZodOptional<z.ZodString>;
    logicalPath: z.ZodString;
    rootEntries: z.ZodReadonly<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
declare const compiledConnectionDefinitionSchema: z.ZodObject<{
    experimental_events: z.ZodOptional<z.ZodLiteral<true>>;
    connectionName: z.ZodString;
    description: z.ZodString;
    exportName: z.ZodOptional<z.ZodString>;
    logicalPath: z.ZodString;
    protocol: z.ZodDefault<z.ZodEnum<{
        mcp: "mcp";
        openapi: "openapi";
    }>>;
    sourceId: z.ZodString;
    sourceKind: z.ZodLiteral<"module">;
    url: z.ZodString;
    vercelConnect: z.ZodOptional<z.ZodObject<{
        connector: z.ZodString;
        requirement: z.ZodOptional<z.ZodObject<{
            method: z.ZodOptional<z.ZodString>;
            reference: z.ZodString;
            service: z.ZodString;
            subjectTypes: z.ZodReadonly<z.ZodArray<z.ZodEnum<{
                app: "app";
                user: "user";
            }>>>;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
}, z.core.$strict>;
declare const compiledAgentResourcesSchema: z.ZodObject<{
    agentRoot: z.ZodString;
    appRoot: z.ZodString;
    bindings: z.ZodRecord<z.ZodString, z.ZodType<CompiledModuleBinding, unknown, z.core.$ZodTypeInternals<CompiledModuleBinding, unknown>>>;
    channelRoutes: z.ZodType<CompiledChannelRoutePlan, unknown, z.core.$ZodTypeInternals<CompiledChannelRoutePlan, unknown>>;
    connections: z.ZodArray<z.ZodObject<{
        experimental_events: z.ZodOptional<z.ZodLiteral<true>>;
        connectionName: z.ZodString;
        description: z.ZodString;
        exportName: z.ZodOptional<z.ZodString>;
        logicalPath: z.ZodString;
        protocol: z.ZodDefault<z.ZodEnum<{
            mcp: "mcp";
            openapi: "openapi";
        }>>;
        sourceId: z.ZodString;
        sourceKind: z.ZodLiteral<"module">;
        url: z.ZodString;
        vercelConnect: z.ZodOptional<z.ZodObject<{
            connector: z.ZodString;
            requirement: z.ZodOptional<z.ZodObject<{
                method: z.ZodOptional<z.ZodString>;
                reference: z.ZodString;
                service: z.ZodString;
                subjectTypes: z.ZodReadonly<z.ZodArray<z.ZodEnum<{
                    app: "app";
                    user: "user";
                }>>>;
            }, z.core.$strict>>;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
    definitions: z.ZodArray<z.ZodType<CompiledDefinition, unknown, z.core.$ZodTypeInternals<CompiledDefinition, unknown>>>;
    diagnosticsSummary: z.ZodObject<{
        errors: z.ZodNumber;
        warnings: z.ZodNumber;
    }, z.core.$strict>;
    sourceComposition: z.ZodType<AgentSourceComposition, unknown, z.core.$ZodTypeInternals<AgentSourceComposition, unknown>>;
    extensionMounts: z.ZodDefault<z.ZodArray<z.ZodType<CompiledExtensionMount, unknown, z.core.$ZodTypeInternals<CompiledExtensionMount, unknown>>>>;
    sandbox: z.ZodObject<{
        providerName: z.ZodOptional<z.ZodString>;
        environmentExportName: z.ZodOptional<z.ZodString>;
        inheritsParent: z.ZodOptional<z.ZodBoolean>;
        exportName: z.ZodOptional<z.ZodString>;
        logicalPath: z.ZodString;
        revisionHash: z.ZodString;
        sourceId: z.ZodString;
        sourceKind: z.ZodLiteral<"module">;
    }, z.core.$strict>;
    sandboxWorkspaces: z.ZodArray<z.ZodObject<{
        logicalPath: z.ZodString;
        rootEntries: z.ZodReadonly<z.ZodArray<z.ZodString>>;
        sourceId: z.ZodString;
        sourcePath: z.ZodString;
    }, z.core.$strict>>;
    schedules: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        cron: z.ZodString;
        hasRun: z.ZodBoolean;
        name: z.ZodString;
        logicalPath: z.ZodString;
        markdown: z.ZodOptional<z.ZodString>;
        sourceId: z.ZodString;
        owner: z.ZodType<AgentSourceOwner, unknown, z.core.$ZodTypeInternals<AgentSourceOwner, unknown>>;
        sourceKind: z.ZodLiteral<"markdown">;
    }, z.core.$strict>, z.ZodObject<{
        cron: z.ZodString;
        hasRun: z.ZodBoolean;
        name: z.ZodString;
        logicalPath: z.ZodString;
        markdown: z.ZodOptional<z.ZodString>;
        sourceId: z.ZodString;
        sourceKind: z.ZodLiteral<"module">;
    }, z.core.$strict>], "sourceKind">>;
    scheduleCollections: z.ZodDefault<z.ZodArray<z.ZodObject<{
        application: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        logicalPath: z.ZodString;
        name: z.ZodString;
        providerKind: z.ZodString;
        sourceId: z.ZodString;
        sourceKind: z.ZodLiteral<"module">;
        tools: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodLiteral<"deferred">]>>;
    }, z.core.$strict>>>;
    remoteAgents: z.ZodArray<z.ZodType<Readonly<ModuleSourceRef & Node & {
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
        tool?: import("#shared/agent-definition.js").AgentToolExposure;
        url?: string;
    }>, unknown, z.core.$ZodTypeInternals<Readonly<ModuleSourceRef & Node & {
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
        tool?: import("#shared/agent-definition.js").AgentToolExposure;
        url?: string;
    }>, unknown>>>;
    skills: z.ZodReadonly<z.ZodArray<z.ZodType<CompiledSkillDefinition, unknown, z.core.$ZodTypeInternals<CompiledSkillDefinition, unknown>>>>;
    instructions: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodType<CompiledInstructionsDefinition, unknown, z.core.$ZodTypeInternals<CompiledInstructionsDefinition, unknown>>>>>;
    tools: z.ZodArray<z.ZodObject<{
        availableInSubagents: z.ZodOptional<z.ZodBoolean>;
        behavior: z.ZodOptional<z.ZodType<CompiledToolBehavior, unknown, z.core.$ZodTypeInternals<CompiledToolBehavior, unknown>>>;
        deferred: z.ZodOptional<z.ZodBoolean>;
        description: z.ZodString;
        exportName: z.ZodOptional<z.ZodString>;
        hasExecute: z.ZodBoolean;
        hasModelOutputProjection: z.ZodBoolean;
        inputSchema: z.ZodNullable<z.ZodType<JsonObject, unknown, z.core.$ZodTypeInternals<JsonObject, unknown>>>;
        logicalPath: z.ZodString;
        modelInputSchema: z.ZodOptional<z.ZodType<JsonObject, unknown, z.core.$ZodTypeInternals<JsonObject, unknown>>>;
        name: z.ZodString;
        outputSchema: z.ZodOptional<z.ZodType<JsonObject, unknown, z.core.$ZodTypeInternals<JsonObject, unknown>>>;
        requiresApproval: z.ZodBoolean;
        sourceId: z.ZodString;
        sourceKind: z.ZodLiteral<"module">;
        workflowProgram: z.ZodOptional<z.ZodObject<{
            maxSubagents: z.ZodNumber;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
    workspaceResourceRoot: z.ZodObject<{
        contentHash: z.ZodOptional<z.ZodString>;
        logicalPath: z.ZodString;
        rootEntries: z.ZodReadonly<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
}, z.core.$strict>;
declare const compiledAgentNodeManifestSchema: z.ZodObject<{
    agentRoot: z.ZodString;
    appRoot: z.ZodString;
    bindings: z.ZodRecord<z.ZodString, z.ZodType<CompiledModuleBinding, unknown, z.core.$ZodTypeInternals<CompiledModuleBinding, unknown>>>;
    channelRoutes: z.ZodType<CompiledChannelRoutePlan, unknown, z.core.$ZodTypeInternals<CompiledChannelRoutePlan, unknown>>;
    connections: z.ZodArray<z.ZodObject<{
        experimental_events: z.ZodOptional<z.ZodLiteral<true>>;
        connectionName: z.ZodString;
        description: z.ZodString;
        exportName: z.ZodOptional<z.ZodString>;
        logicalPath: z.ZodString;
        protocol: z.ZodDefault<z.ZodEnum<{
            mcp: "mcp";
            openapi: "openapi";
        }>>;
        sourceId: z.ZodString;
        sourceKind: z.ZodLiteral<"module">;
        url: z.ZodString;
        vercelConnect: z.ZodOptional<z.ZodObject<{
            connector: z.ZodString;
            requirement: z.ZodOptional<z.ZodObject<{
                method: z.ZodOptional<z.ZodString>;
                reference: z.ZodString;
                service: z.ZodString;
                subjectTypes: z.ZodReadonly<z.ZodArray<z.ZodEnum<{
                    app: "app";
                    user: "user";
                }>>>;
            }, z.core.$strict>>;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
    definitions: z.ZodArray<z.ZodType<CompiledDefinition, unknown, z.core.$ZodTypeInternals<CompiledDefinition, unknown>>>;
    diagnosticsSummary: z.ZodObject<{
        errors: z.ZodNumber;
        warnings: z.ZodNumber;
    }, z.core.$strict>;
    sourceComposition: z.ZodType<AgentSourceComposition, unknown, z.core.$ZodTypeInternals<AgentSourceComposition, unknown>>;
    extensionMounts: z.ZodDefault<z.ZodArray<z.ZodType<CompiledExtensionMount, unknown, z.core.$ZodTypeInternals<CompiledExtensionMount, unknown>>>>;
    sandbox: z.ZodObject<{
        providerName: z.ZodOptional<z.ZodString>;
        environmentExportName: z.ZodOptional<z.ZodString>;
        inheritsParent: z.ZodOptional<z.ZodBoolean>;
        exportName: z.ZodOptional<z.ZodString>;
        logicalPath: z.ZodString;
        revisionHash: z.ZodString;
        sourceId: z.ZodString;
        sourceKind: z.ZodLiteral<"module">;
    }, z.core.$strict>;
    sandboxWorkspaces: z.ZodArray<z.ZodObject<{
        logicalPath: z.ZodString;
        rootEntries: z.ZodReadonly<z.ZodArray<z.ZodString>>;
        sourceId: z.ZodString;
        sourcePath: z.ZodString;
    }, z.core.$strict>>;
    schedules: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        cron: z.ZodString;
        hasRun: z.ZodBoolean;
        name: z.ZodString;
        logicalPath: z.ZodString;
        markdown: z.ZodOptional<z.ZodString>;
        sourceId: z.ZodString;
        owner: z.ZodType<AgentSourceOwner, unknown, z.core.$ZodTypeInternals<AgentSourceOwner, unknown>>;
        sourceKind: z.ZodLiteral<"markdown">;
    }, z.core.$strict>, z.ZodObject<{
        cron: z.ZodString;
        hasRun: z.ZodBoolean;
        name: z.ZodString;
        logicalPath: z.ZodString;
        markdown: z.ZodOptional<z.ZodString>;
        sourceId: z.ZodString;
        sourceKind: z.ZodLiteral<"module">;
    }, z.core.$strict>], "sourceKind">>;
    scheduleCollections: z.ZodDefault<z.ZodArray<z.ZodObject<{
        application: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        logicalPath: z.ZodString;
        name: z.ZodString;
        providerKind: z.ZodString;
        sourceId: z.ZodString;
        sourceKind: z.ZodLiteral<"module">;
        tools: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodLiteral<"deferred">]>>;
    }, z.core.$strict>>>;
    remoteAgents: z.ZodArray<z.ZodType<Readonly<ModuleSourceRef & Node & {
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
        tool?: import("#shared/agent-definition.js").AgentToolExposure;
        url?: string;
    }>, unknown, z.core.$ZodTypeInternals<Readonly<ModuleSourceRef & Node & {
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
        tool?: import("#shared/agent-definition.js").AgentToolExposure;
        url?: string;
    }>, unknown>>>;
    skills: z.ZodReadonly<z.ZodArray<z.ZodType<CompiledSkillDefinition, unknown, z.core.$ZodTypeInternals<CompiledSkillDefinition, unknown>>>>;
    instructions: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodType<CompiledInstructionsDefinition, unknown, z.core.$ZodTypeInternals<CompiledInstructionsDefinition, unknown>>>>>;
    tools: z.ZodArray<z.ZodObject<{
        availableInSubagents: z.ZodOptional<z.ZodBoolean>;
        behavior: z.ZodOptional<z.ZodType<CompiledToolBehavior, unknown, z.core.$ZodTypeInternals<CompiledToolBehavior, unknown>>>;
        deferred: z.ZodOptional<z.ZodBoolean>;
        description: z.ZodString;
        exportName: z.ZodOptional<z.ZodString>;
        hasExecute: z.ZodBoolean;
        hasModelOutputProjection: z.ZodBoolean;
        inputSchema: z.ZodNullable<z.ZodType<JsonObject, unknown, z.core.$ZodTypeInternals<JsonObject, unknown>>>;
        logicalPath: z.ZodString;
        modelInputSchema: z.ZodOptional<z.ZodType<JsonObject, unknown, z.core.$ZodTypeInternals<JsonObject, unknown>>>;
        name: z.ZodString;
        outputSchema: z.ZodOptional<z.ZodType<JsonObject, unknown, z.core.$ZodTypeInternals<JsonObject, unknown>>>;
        requiresApproval: z.ZodBoolean;
        sourceId: z.ZodString;
        sourceKind: z.ZodLiteral<"module">;
        workflowProgram: z.ZodOptional<z.ZodObject<{
            maxSubagents: z.ZodNumber;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
    workspaceResourceRoot: z.ZodObject<{
        contentHash: z.ZodOptional<z.ZodString>;
        logicalPath: z.ZodString;
        rootEntries: z.ZodReadonly<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
    config: z.ZodType<CompiledAgentDefinition, unknown, z.core.$ZodTypeInternals<CompiledAgentDefinition, unknown>>;
}, z.core.$strict>;
/**
 * One mounted extension recorded on a compiled agent manifest. The runtime
 * evaluates {@link mountLogicalPath} at module-map load so the mount's factory
 * call binds the extension's config on its instance handle before any tool runs.
 */
export interface CompiledExtensionMount {
    /** Runtime packages this extension requires the consuming application to externalize. */
    readonly externalDependencies: readonly string[];
    /** Mount-derived namespace that prefixes the extension's tool/skill names. */
    readonly namespace: string;
    readonly packageName: string;
    /** Package export imported by the mount declaration. */
    readonly specifier: string;
    /** Canonical path of this mount in the root agent tree. */
    readonly mountId: string;
    /** Absolute path to the extension's distributed source root. */
    readonly sourceRoot: string;
    readonly mountSourceId: string;
    readonly mountSourcePath: string;
    readonly mountLogicalPath: string;
    readonly programmaticImport?: {
        readonly specifier: string;
        readonly entryPath: string;
        readonly config: JsonObject;
    };
}
/**
 * Zod schema for the versioned compiled manifest emitted by the compiler.
 */
export declare const compiledAgentManifestSchema: z.ZodObject<{
    agentRoot: z.ZodString;
    appRoot: z.ZodString;
    bindings: z.ZodRecord<z.ZodString, z.ZodType<CompiledModuleBinding, unknown, z.core.$ZodTypeInternals<CompiledModuleBinding, unknown>>>;
    channelRoutes: z.ZodType<CompiledChannelRoutePlan, unknown, z.core.$ZodTypeInternals<CompiledChannelRoutePlan, unknown>>;
    connections: z.ZodArray<z.ZodObject<{
        experimental_events: z.ZodOptional<z.ZodLiteral<true>>;
        connectionName: z.ZodString;
        description: z.ZodString;
        exportName: z.ZodOptional<z.ZodString>;
        logicalPath: z.ZodString;
        protocol: z.ZodDefault<z.ZodEnum<{
            mcp: "mcp";
            openapi: "openapi";
        }>>;
        sourceId: z.ZodString;
        sourceKind: z.ZodLiteral<"module">;
        url: z.ZodString;
        vercelConnect: z.ZodOptional<z.ZodObject<{
            connector: z.ZodString;
            requirement: z.ZodOptional<z.ZodObject<{
                method: z.ZodOptional<z.ZodString>;
                reference: z.ZodString;
                service: z.ZodString;
                subjectTypes: z.ZodReadonly<z.ZodArray<z.ZodEnum<{
                    app: "app";
                    user: "user";
                }>>>;
            }, z.core.$strict>>;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
    definitions: z.ZodArray<z.ZodType<CompiledDefinition, unknown, z.core.$ZodTypeInternals<CompiledDefinition, unknown>>>;
    diagnosticsSummary: z.ZodObject<{
        errors: z.ZodNumber;
        warnings: z.ZodNumber;
    }, z.core.$strict>;
    sourceComposition: z.ZodType<AgentSourceComposition, unknown, z.core.$ZodTypeInternals<AgentSourceComposition, unknown>>;
    extensionMounts: z.ZodDefault<z.ZodArray<z.ZodType<CompiledExtensionMount, unknown, z.core.$ZodTypeInternals<CompiledExtensionMount, unknown>>>>;
    sandbox: z.ZodObject<{
        providerName: z.ZodOptional<z.ZodString>;
        environmentExportName: z.ZodOptional<z.ZodString>;
        inheritsParent: z.ZodOptional<z.ZodBoolean>;
        exportName: z.ZodOptional<z.ZodString>;
        logicalPath: z.ZodString;
        revisionHash: z.ZodString;
        sourceId: z.ZodString;
        sourceKind: z.ZodLiteral<"module">;
    }, z.core.$strict>;
    sandboxWorkspaces: z.ZodArray<z.ZodObject<{
        logicalPath: z.ZodString;
        rootEntries: z.ZodReadonly<z.ZodArray<z.ZodString>>;
        sourceId: z.ZodString;
        sourcePath: z.ZodString;
    }, z.core.$strict>>;
    schedules: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        cron: z.ZodString;
        hasRun: z.ZodBoolean;
        name: z.ZodString;
        logicalPath: z.ZodString;
        markdown: z.ZodOptional<z.ZodString>;
        sourceId: z.ZodString;
        owner: z.ZodType<AgentSourceOwner, unknown, z.core.$ZodTypeInternals<AgentSourceOwner, unknown>>;
        sourceKind: z.ZodLiteral<"markdown">;
    }, z.core.$strict>, z.ZodObject<{
        cron: z.ZodString;
        hasRun: z.ZodBoolean;
        name: z.ZodString;
        logicalPath: z.ZodString;
        markdown: z.ZodOptional<z.ZodString>;
        sourceId: z.ZodString;
        sourceKind: z.ZodLiteral<"module">;
    }, z.core.$strict>], "sourceKind">>;
    scheduleCollections: z.ZodDefault<z.ZodArray<z.ZodObject<{
        application: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        logicalPath: z.ZodString;
        name: z.ZodString;
        providerKind: z.ZodString;
        sourceId: z.ZodString;
        sourceKind: z.ZodLiteral<"module">;
        tools: z.ZodOptional<z.ZodUnion<readonly [z.ZodBoolean, z.ZodLiteral<"deferred">]>>;
    }, z.core.$strict>>>;
    remoteAgents: z.ZodArray<z.ZodType<Readonly<ModuleSourceRef & Node & {
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
        tool?: import("#shared/agent-definition.js").AgentToolExposure;
        url?: string;
    }>, unknown, z.core.$ZodTypeInternals<Readonly<ModuleSourceRef & Node & {
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
        tool?: import("#shared/agent-definition.js").AgentToolExposure;
        url?: string;
    }>, unknown>>>;
    skills: z.ZodReadonly<z.ZodArray<z.ZodType<CompiledSkillDefinition, unknown, z.core.$ZodTypeInternals<CompiledSkillDefinition, unknown>>>>;
    instructions: z.ZodDefault<z.ZodReadonly<z.ZodArray<z.ZodType<CompiledInstructionsDefinition, unknown, z.core.$ZodTypeInternals<CompiledInstructionsDefinition, unknown>>>>>;
    tools: z.ZodArray<z.ZodObject<{
        availableInSubagents: z.ZodOptional<z.ZodBoolean>;
        behavior: z.ZodOptional<z.ZodType<CompiledToolBehavior, unknown, z.core.$ZodTypeInternals<CompiledToolBehavior, unknown>>>;
        deferred: z.ZodOptional<z.ZodBoolean>;
        description: z.ZodString;
        exportName: z.ZodOptional<z.ZodString>;
        hasExecute: z.ZodBoolean;
        hasModelOutputProjection: z.ZodBoolean;
        inputSchema: z.ZodNullable<z.ZodType<JsonObject, unknown, z.core.$ZodTypeInternals<JsonObject, unknown>>>;
        logicalPath: z.ZodString;
        modelInputSchema: z.ZodOptional<z.ZodType<JsonObject, unknown, z.core.$ZodTypeInternals<JsonObject, unknown>>>;
        name: z.ZodString;
        outputSchema: z.ZodOptional<z.ZodType<JsonObject, unknown, z.core.$ZodTypeInternals<JsonObject, unknown>>>;
        requiresApproval: z.ZodBoolean;
        sourceId: z.ZodString;
        sourceKind: z.ZodLiteral<"module">;
        workflowProgram: z.ZodOptional<z.ZodObject<{
            maxSubagents: z.ZodNumber;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
    workspaceResourceRoot: z.ZodObject<{
        contentHash: z.ZodOptional<z.ZodString>;
        logicalPath: z.ZodString;
        rootEntries: z.ZodReadonly<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>;
    config: z.ZodType<CompiledAgentDefinition, unknown, z.core.$ZodTypeInternals<CompiledAgentDefinition, unknown>>;
    kind: z.ZodLiteral<"eve-agent-compiled-manifest">;
    subagents: z.ZodArray<z.ZodType<CompiledSubagentNode, unknown, z.core.$ZodTypeInternals<CompiledSubagentNode, unknown>>>;
    version: z.ZodLiteral<56>;
}, z.core.$strict>;
export interface CreateCompiledAgentResourcesInput {
    readonly agentRoot: string;
    readonly appRoot: string;
    readonly bindings: Readonly<Record<string, CompiledModuleBinding>>;
    readonly channelRoutes: CompiledChannelRoutePlan;
    readonly connections?: readonly CompiledConnectionDefinition[];
    readonly definitions?: readonly CompiledDefinition[];
    readonly diagnosticsSummary?: DiscoverDiagnosticsSummary;
    readonly sourceComposition: AgentSourceComposition;
    readonly extensionMounts?: readonly CompiledExtensionMount[];
    readonly remoteAgents?: readonly CompiledRemoteAgentNode[];
    readonly sandbox: CompiledSandboxDefinition;
    readonly sandboxWorkspaces?: readonly CompiledSandboxWorkspace[];
    readonly schedules?: readonly CompiledScheduleDefinition[];
    readonly scheduleCollections?: readonly CompiledScheduleCollectionDefinition[];
    readonly skills?: readonly CompiledSkillDefinition[];
    readonly instructions?: readonly CompiledInstructionsDefinition[];
    readonly tools?: readonly CompiledToolDefinition[];
    readonly workspaceResourceRoot?: CompiledWorkspaceResourceRoot;
}
/** Creates compiled filesystem-owned resources with stable defaults. */
export declare function createCompiledAgentResources(input: CreateCompiledAgentResourcesInput): CompiledAgentResources;
/** Creates a compiled authored agent payload with stable defaults. */
export declare function createCompiledAgentNodeManifest(input: CreateCompiledAgentResourcesInput & {
    readonly config: CompiledAgentDefinition;
}): CompiledAgentNodeManifest;
/**
 * The sorted root entries of a node's workspace resource tree. The in-memory manifest factory and
 * `materializeWorkspaceResources` both use it, so both emit identical descriptors.
 */
export declare function deriveResourceRootEntries(sandboxWorkspaces: readonly CompiledSandboxWorkspace[]): readonly string[];
/**
 * Creates one stable compiled subagent node id from the parent node id and the
 * source entry discovered in that parent package.
 */
export declare function createCompiledSubagentNodeId(parentNodeId: string, sourceId: string): string;
/**
 * Creates a compiled manifest with stable defaults.
 */
export declare function createCompiledAgentManifest(input: CreateCompiledAgentResourcesInput & {
    readonly config: CompiledAgentDefinition;
    readonly subagents?: readonly CompiledSubagentNode[];
}): CompiledAgentManifest;
