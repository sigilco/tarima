/**
 * Discord connection sign-ins. A sign-in link is a credential: whoever
 * completes it binds their account to the person who asked. In a DM the bot
 * posts the link directly. In a server the shared message carries no link or
 * code, only a button, and eve answers its press with an ephemeral message
 * that shows the challenge to the presser alone, and only when the presser is
 * the person who must sign in.
 */
import type { Session } from "#channel/session.js";
import type { SignIn } from "#channel/sign-in.js";
import type { SessionAuthContext } from "#channel/types.js";
import type { DiscordMessageBody } from "#public/channels/discord/api.js";
/** Custom id prefix of the shared sign-in message's button. */
export declare const DISCORD_AUTHORIZATION_CUSTOM_ID_PREFIX = "eve_auth:";
/** The sign-in attempt a shared message's button names, as an opaque digest. */
export interface DiscordAuthorizationReveal {
    readonly attempt: string;
}
/** The full sign-in, link and code included, for the person signing in alone. */
export declare function renderDiscordAuthorizationPrompt(event: SignIn): DiscordMessageBody;
/** The shared sign-in message: who must sign in, and a button that shows them the challenge. */
export declare function renderDiscordAuthorizationStatus(event: SignIn): DiscordMessageBody;
/** Reads the sign-in attempt a button names, or `null` for any other component. */
export declare function readDiscordAuthorizationReveal(customId: string): DiscordAuthorizationReveal | null;
/**
 * Answers a press of the shared message's button with an ephemeral message.
 * The challenge comes from the session's own stream and goes back only when
 * the presser's principal is the one that must sign in; nothing the button
 * carries is trusted for identity.
 */
export declare function answerDiscordAuthorizationReveal(input: {
    readonly auth: SessionAuthContext | null;
    readonly resolveSession: () => Promise<Session | undefined>;
    readonly reveal: DiscordAuthorizationReveal;
}): Promise<DiscordMessageBody>;
