import type { SessionCallback, SessionParent } from "#channel/types.js";
import type { InstrumentationParentLineage } from "#instrumentation/lifecycle.js";
/**
 * Resolves the dispatch that created the running session, if any. Dispatch
 * splits the lineage across two owners — the identifiers onto
 * {@link SessionParent}, the subagent name onto the adapter state — so both
 * are read here rather than either being duplicated onto the other.
 */
export declare function resolveParentLineage(parent: SessionParent | undefined, adapter: {
    readonly state?: unknown;
} | undefined, callback?: SessionCallback): InstrumentationParentLineage | undefined;
