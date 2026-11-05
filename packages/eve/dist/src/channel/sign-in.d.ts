import type { SessionView } from "#protocol/session-projection/tables.js";
import type { InteractionOutcome, InteractionSettledData } from "#protocol/session-events/families/interaction.js";
/** A sign-in as a channel shows it. */
export interface SignIn {
    readonly interactionId: string;
    /** The connection's name, which keys what a channel posted for it. */
    readonly name: string;
    readonly displayName: string;
    readonly url?: string;
    readonly userCode?: string;
    readonly instructions?: string;
    /** The principal that must sign in. */
    readonly principalId?: string;
    /** The approval response whose responder signs in; such a sign-in has its own prompt. */
    readonly responseId?: string;
    /** The turn the sign-in holds. */
    readonly turnId?: string;
}
/** The sign-in an interaction is, or `undefined` for any other interaction. */
export declare function signInOf(view: SessionView, interactionId: string): SignIn | undefined;
/** The challenge as text: what to open or enter. Only its person may read it. */
export declare function signInChallengeText(signIn: SignIn): string;
/** How a sign-in ended, for the conversation. */
export declare function signInEndedText(input: {
    readonly displayName: string;
    readonly outcome: InteractionOutcome;
    readonly reason?: string;
}): string;
/** What a channel can do for a sign-in. */
export interface SignInSurface {
    /** Only the person signing in reads the conversation, so the challenge can go in it. */
    readonly private: boolean;
    /** Posts the challenge in a private conversation; the posted message's id, if it can edit it. */
    postChallenge(signIn: SignIn): Promise<string | undefined>;
    /** Shows the challenge to its person alone, outside the conversation; false when it can't. */
    deliverPrivately?(signIn: SignIn): Promise<boolean>;
    /** Posts text in the conversation; the posted message's id, if it can edit it. */
    post(text: string): Promise<string | undefined>;
    /** Posts the link-free status its own way, instead of as the default text. */
    postStatus?(signIn: SignIn, delivered: boolean): Promise<string | undefined>;
    /** Replaces a posted message's text. Without it, an ending posts as a new message. */
    edit?(messageId: string, text: string): Promise<void>;
    /** Shows the turn working again. */
    typing?(status: string): Promise<void>;
    /**
     * What the channel posted for each open sign-in, by connection name, kept in its state: the
     * message to edit, or `""` for one it can't.
     */
    readonly posted: {
        get(name: string): string | undefined;
        set(name: string, messageId: string | undefined): void;
    };
}
/** Shows a sign-in once, where its challenge stays with its person. */
export declare function showSignIn(view: SessionView, interactionId: string, surface: SignInSurface): Promise<void>;
/** Shows how a sign-in the channel showed ended, and the turn resuming once it's accepted. */
export declare function settleSignIn(view: SessionView, data: InteractionSettledData, surface: SignInSurface): Promise<void>;
/** A `posted` record over a map of message ids by connection name in a channel's state. */
export declare function postedIn<K extends string>(state: {
    [P in K]?: Record<string, string> | undefined;
}, key: K): SignInSurface["posted"];
