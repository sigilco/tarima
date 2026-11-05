import type { ContextReader } from "#context/key.js";
/**
 * Session id that a run's spans carry as `vercel.session_id`.
 *
 * Falls back to the lineage root, then to the run's own session for a
 * top-level run.
 */
export declare function resolveTraceRootSessionId(ctx: ContextReader, sessionId: string): string;
