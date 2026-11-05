import type { ContextReader } from "#context/key.js";
import type { SessionFrame } from "#dynamic/definition.js";
import type { SessionView } from "#protocol/session-projection/tables.js";
/** The channel the session's latest delivery came through. */
export declare function channelOf(ctx: ContextReader): SessionFrame["channel"];
/**
 * The session as of its latest commit, or as of the commit `at` the given view: what every
 * dynamic value and hook handler reads.
 */
export declare function sessionFrameOf(ctx: ContextReader, input?: {
    readonly view?: SessionView;
    readonly at?: string;
}): SessionFrame;
