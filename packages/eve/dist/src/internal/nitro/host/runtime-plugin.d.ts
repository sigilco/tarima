import type { GeneratedCompiledArtifactsFiles } from "#internal/application/compiled-artifacts.js";
/** The Nitro virtual id of eve's generated runtime plugin. */
export declare const EVE_RUNTIME_PLUGIN_ID = "#eve/runtime";
/** What eve's runtime plugin installs, ahead of every other runtime plugin. */
export interface HostRuntime {
    /** Captures traces locally in a dev host without authored instrumentation. */
    readonly localTracing: boolean;
    /** Installs the `run` runtime for agents with a generated-program tool. */
    readonly workflowSandbox: boolean;
}
/**
 * Generates eve's Nitro runtime plugin. Importing it installs the compiled
 * artifacts and the Workflow world, so a failure there fails the server boot
 * instead of leaving a server that rejects every request; the plugin then
 * installs what the host spec selects and closes the World with the server.
 */
export declare function createRuntimePluginSource(runtime: HostRuntime, compiledArtifacts: Pick<GeneratedCompiledArtifactsFiles, "bootstrapPath" | "workflowWorldPluginPath">): string;
