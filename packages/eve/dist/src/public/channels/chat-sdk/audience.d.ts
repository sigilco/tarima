import type { ChatSdkChannelState, ChatSdkInstrumentationMetadata } from "#public/channels/chat-sdk/chatSdkChannel.js";
import type { AudienceContext } from "#shared/conversation-context.js";
declare function chatSdkInstrumentationMetadata(state: ChatSdkChannelState): ChatSdkInstrumentationMetadata;
export declare const chatSdkInstrumentation: {
    readonly audience: (input: AudienceContext<ChatSdkChannelState>) => "private" | "public" | "unknown";
    readonly metadata: typeof chatSdkInstrumentationMetadata;
};
export {};
