/** Builds the startup card the dev TUI commits before the first prompt. */
import type { AgentInfoResult } from "#client/index.js";
import type { Theme } from "./theme.js";
interface AgentHeaderInput {
    /** Resolved display name used when agent inspection is unavailable. */
    name?: string;
    /** Agent inspection payload, or `undefined` when it could not be fetched. */
    info?: AgentInfoResult;
    theme: Theme;
    /** Available terminal width. */
    width: number;
}
/** Returns the styled rows of the startup card. */
export declare function buildAgentHeader(input: AgentHeaderInput): string[];
export {};
