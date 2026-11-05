import type { InvokeToolFn } from "#channel/invoke-tool.js";
import { type InvokeToolRuntime } from "#execution/invoke-tool.js";
import { type NitroArtifactsConfig } from "#internal/nitro/routes/runtime-artifacts.js";
import type { RuntimeCompiledArtifactsSource } from "#runtime/compiled-artifacts-source.js";
import type { InvokeToolTraceOrigin } from "#tracing/eve/invoke-tool-span.js";
/**
 * Builds the route's `invokeTool`. The agent's static tools and sandbox load on
 * the first call, so routes that never invoke a tool pay nothing.
 */
export declare function createRouteInvokeTool(input: {
    /** The agent's name, on every call's span and in its trace policy input. */
    readonly agentName: string;
    readonly config: NitroArtifactsConfig;
    /** The channel this route belongs to; trace policy classifies calls by it. */
    readonly origin?: InvokeToolTraceOrigin;
    readonly requestUrl: string;
}): InvokeToolFn;
/** The part of `InvokeToolRuntime` that comes from the compiled agent. */
export type LoadedInvokeToolRuntime = Omit<InvokeToolRuntime, "agentName" | "origin">;
/** Loads the root agent's static tools and sandbox. Dynamic resolvers are not run. */
export declare function loadInvokeToolRuntime(input: {
    readonly callbackBaseUrl: string;
    readonly compiledArtifactsSource: RuntimeCompiledArtifactsSource;
}): Promise<LoadedInvokeToolRuntime>;
