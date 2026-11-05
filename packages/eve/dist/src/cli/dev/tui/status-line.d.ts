import type { Theme } from "./theme.js";
import type { LogDisplayMode } from "./log-display-mode.js";
import type { RemoteConnectionSnapshot } from "./remote-connection.js";
import type { VercelStatusSnapshot } from "./vercel-status.js";
import type { AgentInfoResult } from "#client/index.js";
export interface DevBuildStatus {
    readonly phase: "building" | "complete";
    readonly summary: string;
}
interface StatusLineInput {
    /** Transient authored-source build state, independent of the server log filter. */
    devBuild?: DevBuildStatus;
    /** Resolved model slug, e.g. "anthropic/claude-sonnet-5"; absent when `/eve/v1/info` failed. */
    model?: string;
    /** Keep the dynamic-model label separate from the resolved model id. */
    dynamicModel?: boolean;
    /** Authored reasoning effort, shown after the model label, e.g. `· high`. */
    reasoning?: string;
    /** True when the Gateway priority tier is on; adds a speed marker. */
    fastMode?: boolean;
    /**
     * Transient dev-TUI log-display mode shown after a Ctrl+L cycle, e.g.
     * `sandbox`. Rendered as a prominent leading `logs: <mode>` segment that
     * survives width degradation and can stand alone; absent once the hint times
     * out.
     */
    logLevel?: LogDisplayMode;
    /** Model endpoint readiness: external, or AI Gateway connected/not-connected. */
    endpoint?: AgentInfoResult["agent"]["model"]["endpoint"];
    /** Workspace-scoped Vercel state; identity absent while unlinked or still resolving. */
    vercel?: VercelStatusSnapshot;
    /** Remote server identity and its current connection/authentication state. */
    remote?: RemoteConnectionSnapshot;
    theme: Theme;
    width: number;
}
/** Builds model and connection segments, preserving the remote badge at narrow widths. */
export declare function buildStatusLine(input: StatusLineInput): string | undefined;
export {};
