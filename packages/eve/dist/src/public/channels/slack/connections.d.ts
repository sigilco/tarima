import type { InteractionOutcome } from "#protocol/session-events/families/interaction.js";
import { type SignInCancelTarget } from "#public/channels/slack/sign-in-cancel.js";
export type { InteractionOutcome };
/** A connection name for display (`linear` → `Linear`, `my_crm` → `My crm`). */
export declare function formatConnectionDisplayName(connectionName: string): string;
/**
 * Public status text for an authorization challenge. Deliberately
 * link-free: it must stay safe to post in a shared thread. When the
 * principal has no Slack user in this thread (schedule-initiated sessions,
 * or principals never seen here) the text drops the "Connect with"
 * call-to-action since no one received the link.
 */
export declare function buildAuthRequiredPublicText(input: {
    readonly displayName: string;
    readonly recipientUserId: string | null;
}): string;
/**
 * Final-state markdown for the public status message. Edited in place by
 * sign-in `interaction.settled` so the thread sees resolution without
 * scrolling.
 */
export declare function buildAuthCompletedText(input: {
    readonly displayName: string;
    readonly outcome: InteractionOutcome;
    readonly reason?: string;
}): string;
/** The private sign-in prompt: a link to open, instructions to follow, or both. */
interface AuthEphemeralPrompt {
    readonly displayName: string;
    readonly instructions?: string;
    readonly url?: string;
    readonly userCode?: string;
}
/**
 * Block Kit blocks for the private sign-in prompt. It names the service and
 * why it is asking before the button, because the user may not remember which
 * request needed it. A device-code flow's `userCode` is a fallback the
 * provider shows only sometimes, so it is a quiet hint below the button.
 */
export declare function buildAuthEphemeralBlocks(input: AuthEphemeralPrompt & {
    /** Lets the person cancel the held turn instead of connecting. */
    readonly cancel?: SignInCancelTarget;
}): unknown[];
/** Notification text for the private sign-in prompt, for clients that show no blocks. */
export declare function buildAuthEphemeralText(input: AuthEphemeralPrompt): string;
