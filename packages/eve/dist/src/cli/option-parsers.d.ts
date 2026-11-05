import type { AgentReasoningDefinition } from "#shared/agent-definition.js";
import type { AssistantResponseStatsMode, LogDisplayMode, SubagentDisplayMode, TerminalPartDisplayMode } from "#cli/dev/tui/types.js";
/** Parses a TCP port accepted by the CLI. */
export declare function parsePortOption(value: string): number;
/** Parses a terminal part display mode. */
export declare function parseDisplayMode(value: string): TerminalPartDisplayMode;
/** Parses a subagent task display mode. */
export declare function parseSubagentDisplayMode(value: string): SubagentDisplayMode;
/** Parses an assistant response statistics mode. */
export declare function parseStatsMode(value: string): AssistantResponseStatsMode;
/** Parses a server log display mode. */
export declare function parseLogsMode(value: string): LogDisplayMode;
/** Parses a positive model context-window size. */
export declare function parseContextSizeOption(value: string): number;
/** Parses an authored model reasoning effort. */
export declare function parseAgentNamesOption(value: string): string[];
export declare function parseReasoningOption(value: string): AgentReasoningDefinition;
