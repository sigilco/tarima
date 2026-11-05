import { type CrossChannelToFn } from "#channel/cross-channel-receive.js";
import type { CompiledRuntimeAgentBundle } from "#runtime/sessions/compiled-agent-cache.js";
/**
 * `ctx.to()` for a tool or a workflow tool's step: the root agent's channels,
 * reached through their `receive()` hooks as a route's `ctx.to()` reaches them.
 */
export declare function createToolChannelTo(input: {
    /** Whether a parent, local or remote, delegated the session running the tool. */
    readonly delegated: boolean;
    /** The compiled agent that owns the tool. */
    readonly loadBundle: () => CompiledRuntimeAgentBundle | Promise<CompiledRuntimeAgentBundle>;
}): CrossChannelToFn;
