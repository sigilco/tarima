import type { ChannelAdapter } from "#channel/adapter.js";
/**
 * Framework adapter that bridges a child subagent session to its parent.
 *
 * It relays every interaction fact the child publishes, so the parent channel can render each
 * request, route answers back down, and close its copy when the child settles it.
 */
export declare const SUBAGENT_ADAPTER: ChannelAdapter;
