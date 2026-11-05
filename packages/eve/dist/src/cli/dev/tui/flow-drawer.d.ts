import type { Theme } from "./theme.js";
import { type FlowPanelState } from "./setup-panel.js";
/** Temporary setup content enclosed by a drawer and its navigation controls. */
interface FlowDrawer {
    readonly rows: string[];
    readonly controls: string[];
}
/** Frames an active setup flow above the terminal footer. */
export declare function renderFlowDrawer(state: FlowPanelState, theme: Theme, width: number): FlowDrawer;
/**
 * Frames a transient command panel with the same rules as a setup flow. A `corner` label sits at
 * the right end of the top rule.
 */
export declare function renderTransientDrawer(body: readonly string[], controls: readonly string[], theme: Theme, width: number, corner?: string, compact?: boolean, labelSide?: "left" | "right"): FlowDrawer;
export {};
