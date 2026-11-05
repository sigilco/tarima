import type { ContextAccessor } from "#context/key.js";
import type { ChannelAdapter, ChannelAdapterContext } from "#channel/adapter.js";
/**
 * Builds the {@link ChannelAdapterContext} the runtime hands to an
 * adapter's `deliver` hook, event handlers, and attachment resolver.
 *
 * Session metadata and channel continuation routing resolve live from the supplied accessor.
 */
export declare function buildAdapterContext<TCtx extends ChannelAdapterContext<any> = ChannelAdapterContext>(adapter: ChannelAdapter<TCtx>, accessor: ContextAccessor): TCtx;
