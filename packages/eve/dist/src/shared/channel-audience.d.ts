export declare const CHANNEL_AUDIENCES: readonly ["public", "private", "unknown"];
/** Who can observe the conversation on its originating channel. */
export type ChannelAudience = (typeof CHANNEL_AUDIENCES)[number];
export declare function normalizeChannelAudience(value: unknown): ChannelAudience;
