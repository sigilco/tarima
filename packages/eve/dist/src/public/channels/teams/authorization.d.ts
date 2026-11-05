/**
 * Teams connection sign-in cards. A sign-in link is a credential: whoever
 * completes it binds their account to the person who asked. Outside personal
 * chats the shared card carries no link or code, only an `Action.Execute`
 * button; Teams shows the invoke's response card to the presser alone, and
 * eve answers with the challenge only when the presser is that person.
 */
import type { Session } from "#channel/session.js";
import type { SessionAuthContext } from "#channel/types.js";
import type { SignIn } from "#channel/sign-in.js";
import type { TeamsChannelAccount, TeamsMessageBody } from "#public/channels/teams/api.js";
import type { TeamsInvokeActivity } from "#public/channels/teams/inbound.js";
import { type JsonObject } from "#shared/json.js";
/** Identifies one sign-in attempt from the shared card's button press. */
export interface TeamsAuthorizationReveal {
    readonly interactionId: string;
    readonly name: string;
    readonly replyToActivityId?: string;
}
/** A connection's display name for its sign-in cards (`linear` → `Linear`). */
export declare function teamsAuthorizationDisplayName(event: {
    readonly displayName: string;
    readonly name: string;
}): string;
/** The full sign-in card, link and code included, for the person signing in alone. */
export declare function renderTeamsAuthorizationPrompt(event: SignIn, options: {
    readonly adaptiveCardVersion: string;
    readonly requester: string | undefined;
}): TeamsMessageBody;
/** The shared sign-in card: who must sign in, and a button that shows them the challenge. */
export declare function renderTeamsAuthorizationStatus(event: SignIn, options: {
    readonly adaptiveCardVersion: string;
    readonly replyToActivityId: string | undefined;
    readonly requester: string | undefined;
}): TeamsMessageBody;
/** Reads the sign-in attempt a shared card's button names, or `null` for other invokes. */
export declare function readTeamsAuthorizationReveal(activity: TeamsInvokeActivity): TeamsAuthorizationReveal | null;
/**
 * Answers a press of the shared card's button. The challenge comes from the
 * session's own stream and goes back only when the presser's principal is the
 * one that must sign in; nothing the card carries is trusted for identity.
 */
export declare function answerTeamsAuthorizationReveal(input: {
    readonly adaptiveCardVersion: string;
    readonly auth: SessionAuthContext | null;
    readonly presser: TeamsChannelAccount;
    readonly resolveSession: () => Promise<Session | undefined>;
    readonly reveal: TeamsAuthorizationReveal;
}): Promise<JsonObject>;
