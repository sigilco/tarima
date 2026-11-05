import { type WorkspaceSandbox } from "#execution/sandbox/workspace-root.js";
export declare const MAX_GREP_LIMIT = 200;
export declare const MAX_GREP_COMMAND_BYTES: number;
export declare const MAX_GREP_LINE_BYTES: number;
export declare const MAX_GREP_RETURN_BYTES: number;
export declare const GREP_OUTPUT_MODES: readonly ["files_with_matches", "content", "count"];
type GrepOutputMode = (typeof GREP_OUTPUT_MODES)[number];
interface GrepCommandInput {
    readonly contextLines: number;
    readonly glob: string | undefined;
    readonly ignoreCase: boolean;
    readonly limit: number;
    readonly literal: boolean;
    readonly outputMode: GrepOutputMode;
    readonly path: string;
    readonly pattern: string;
}
export interface GrepSearchResult {
    readonly content: string;
    readonly matchCount: number;
    readonly outputMode: GrepOutputMode;
    readonly path: string;
    readonly truncated: boolean;
}
export interface GrepToolInput {
    readonly context?: number;
    readonly glob?: string;
    readonly ignoreCase?: boolean;
    readonly limit?: number;
    readonly literal?: boolean;
    readonly outputMode?: GrepOutputMode;
    readonly path?: string;
    readonly pattern: string;
}
/** Identifiers are faster as fixed strings. Regex syntax keeps the regex engine. */
export declare function shouldUseFixedStrings(pattern: string, literal: boolean | undefined): boolean;
export declare function effectiveOutputMode(outputMode: GrepOutputMode | undefined): GrepOutputMode;
export declare function effectiveLimit(limit: number | undefined): number;
export declare function assertNoParentSegments(resolved: string, requested?: string): string;
export declare function executeGrepSearch(input: GrepToolInput, sandbox: WorkspaceSandbox, abortSignal?: AbortSignal): Promise<GrepSearchResult>;
export declare function buildSearchCommand(input: GrepCommandInput): string;
export declare function buildRipgrepCommand(input: GrepCommandInput): string;
export declare function buildPosixGrepCommand(input: GrepCommandInput): string;
export declare function processGrepOutput(input: {
    readonly commandTruncated?: boolean;
    readonly contextLines?: number;
    readonly limit: number;
    readonly outputMode: GrepOutputMode;
    readonly path: string;
    readonly stdout: string;
}): GrepSearchResult;
export {};
