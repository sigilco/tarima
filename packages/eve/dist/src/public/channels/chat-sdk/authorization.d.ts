import { type SignInSurface } from "#channel/sign-in.js";
import type { ChatSdkChannelEvents } from "#public/channels/chat-sdk/chatSdkChannel.js";
type SignInChannel = Parameters<NonNullable<ChatSdkChannelEvents["interaction.opened"]>>[1]["channel"];
/** A Chat SDK thread as a sign-in shows on it: a DM is private; elsewhere the challenge goes to the person alone. */
export declare function chatSdkSignIns(channel: SignInChannel): SignInSurface | undefined;
export {};
