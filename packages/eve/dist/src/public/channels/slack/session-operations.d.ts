import type { ChannelFrom, ChannelResolveSession, ChannelRespondOptions, ChannelSendOptions, ChannelSource } from "#channel/channel-operations.js";
import type { SessionAuthContext } from "#channel/types.js";
import type { Answer, StrictAnswers } from "#shared/input.js";
import type { MessageContent } from "#shared/message-content.js";
import type { SlackChannelState } from "#public/channels/slack/slackChannel.js";
type SlackSource = ChannelSource<SlackChannelState>;
/** Options for a message send already bound to one Slack thread. */
export type SlackSendOptions = Omit<ChannelSendOptions<SlackChannelState>, "auth" | "state"> & {
    readonly auth?: SessionAuthContext | null;
};
/** Options for an input response already bound to one Slack thread. */
export type SlackRespondOptions = Omit<ChannelRespondOptions<SlackChannelState>, "auth"> & {
    readonly auth?: SessionAuthContext | null;
};
/** Current-owner operations already bound to one Slack thread. */
export interface SlackSessionOperations {
    send(message: MessageContent, options?: SlackSendOptions): ReturnType<SlackSource["send"]>;
    respond<const TResponses extends readonly Answer[]>(answers: StrictAnswers<TResponses>, options?: SlackRespondOptions): ReturnType<SlackSource["respond"]>;
    cancel(options?: {
        readonly turnId?: string;
    }): ReturnType<SlackSource["cancel"]>;
    compact(): ReturnType<SlackSource["compact"]>;
    clear(): ReturnType<SlackSource["clear"]>;
    end(options?: {
        readonly reason?: string;
    }): ReturnType<SlackSource["end"]>;
    resolveSession(): ReturnType<ChannelResolveSession>;
}
/** Binds Slack state and default auth needed only when a message creates a session. */
export declare function bindSlackSessionOperations(input: {
    readonly address: string;
    readonly defaultAuth: SessionAuthContext | null;
    readonly from: ChannelFrom<SlackChannelState>;
    readonly resolveSession: ChannelResolveSession;
    readonly state: SlackChannelState;
}): SlackSessionOperations;
/**
 * Stamps the verified Slack user behind an input response, so `deliver` can map
 * a custom-auth responder's principal to them. The verified user wins over any
 * caller-supplied value.
 */
export declare function withSlackResponder(state: Partial<SlackChannelState> | undefined, slackUserId: string | null | undefined): Partial<SlackChannelState> | undefined;
export {};
