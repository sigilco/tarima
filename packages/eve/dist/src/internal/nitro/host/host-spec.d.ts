import type { CompiledExtensionMount } from "#compiler/manifest.js";
import type { GeneratedCompiledArtifactsFiles } from "#internal/application/compiled-artifacts.js";
import { type ExternalsPolicy } from "#internal/nitro/host/externals-policy.js";
import { type HostRouteTable } from "#internal/nitro/host/host-routes.js";
import type { PreparedApplicationHost } from "#internal/nitro/host/types.js";
import type { HostRuntime } from "#internal/nitro/host/runtime-plugin.js";
import { createEveVercelOptions } from "#internal/nitro/host/vercel-build-output-config.js";
import type { AgentWorkflowWorldDefinition } from "#shared/agent-definition.js";
export type HostMode = {
    readonly kind: "development";
} | {
    readonly kind: "production";
    readonly preset: "vercel" | undefined;
    /**
     * The agent's public route prefix, baked into the Vercel flow function
     * so callback URLs resolve behind a per-agent mount.
     */
    readonly publicRoutePrefix?: string;
    readonly workspaceMember?: boolean;
};
export interface HostDirectories {
    readonly buildDir: string;
    readonly outputDir: string;
}
/** Nitro runtime plugins eve installs after its own runtime plugin, in load order. */
export type HostRuntimePlugin = "instrumentation" | "local-schedules" | "sandbox-shutdown" | "skill-files";
/** Everything eve's Nitro host serves and bundles, derived from the compiled agent. */
export interface HostSpec {
    readonly agentName: string;
    /** How the host bundles authored sources. */
    readonly authored: HostAuthoredSources;
    readonly development: boolean;
    readonly extensionMounts: readonly CompiledExtensionMount[];
    /** Authored files that override an extension mount's bindings, keyed to the mount id. */
    readonly extensionOverridePaths: ReadonlyMap<string, string>;
    readonly externals: ExternalsPolicy;
    /** Wraps the server entry so authored instrumentation finishes setup first. */
    readonly instrumented: boolean;
    readonly preset: "vercel" | undefined;
    readonly routes: HostRouteTable;
    /** What eve's generated runtime plugin installs. */
    readonly runtime: HostRuntime;
    readonly runtimePlugins: readonly HostRuntimePlugin[];
    /** Skills a production build embeds; dev reads the compile directory. */
    readonly skills: readonly string[];
    readonly vercel: ReturnType<typeof createEveVercelOptions>;
    readonly websocket: boolean;
    /** The configured Workflow world; unset selects the local world. */
    readonly world: AgentWorkflowWorldDefinition | undefined;
    /** Where the host's inputs and outputs live. Nothing here changes what the host does. */
    readonly locations: HostLocations;
}
interface HostAuthoredSources {
    /** Package root authored asset imports may not escape. */
    readonly packageRoot: string;
    /** The authored package's tsconfig or jsconfig, which resolves authored import aliases. */
    readonly tsconfig: string | false;
}
interface HostLocations {
    readonly appRoot: string;
    readonly buildDir: string;
    readonly compiledArtifacts: GeneratedCompiledArtifactsFiles;
    readonly outputDir: string;
    readonly skillsRoot: string;
    readonly workflowBuildDir: string;
}
export declare function createHostSpec(preparedHost: PreparedApplicationHost, mode: HostMode, dirs: HostDirectories): HostSpec;
export {};
