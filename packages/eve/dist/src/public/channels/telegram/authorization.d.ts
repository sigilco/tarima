import type { SignIn } from "#channel/sign-in.js";
export declare const TELEGRAM_AUTHORIZATION_CALLBACK_PREFIX = "eve_auth:";
/** The sign-in prompt for its person: what to do, and a button that opens the sign-in link. */
export declare function renderTelegramAuthorizationPrompt(signIn: Pick<SignIn, "displayName" | "instructions" | "url" | "userCode">): {
    readonly reply_markup?: Readonly<Record<string, unknown>>;
    readonly text: string;
};
/** A group's link-free status, whose button sends the requester the prompt privately. */
export declare function renderTelegramAuthorizationStatus(input: {
    readonly displayName: string;
    readonly requesterUserId?: string | null;
}): {
    readonly reply_markup?: Readonly<Record<string, unknown>>;
    readonly text: string;
};
