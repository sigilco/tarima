/**
 * Whether this CLI invocation was launched by an AI coding agent (Claude Code,
 * Cursor, Codex, ...) rather than a human at a terminal. Wraps
 * `@vercel/detect-agent` so the heuristic's source can change without touching
 * callers.
 */
export declare function isCodingAgentLaunch(): Promise<boolean>;
