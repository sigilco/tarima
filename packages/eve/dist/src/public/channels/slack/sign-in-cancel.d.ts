import type { ChannelFrom } from "#channel/channel-operations.js";
import type { SlackChannelState, SlackSessionTarget } from "#public/channels/slack/slackChannel.js";
/** `action_id` of the sign-in prompt's Cancel button; outside eve's `eve_input:` HITL prefix. */
export declare const SIGN_IN_CANCEL_ACTION_ID = "eve_sign_in:cancel";
/** The held turn a sign-in prompt's Cancel button cancels. */
export type SignInCancelTarget = SlackSessionTarget & {
    readonly turnId: string;
};
/** Reads a Cancel click's target from a sign-in prompt's button value. */
export declare function parseSignInCancelTarget(value: unknown): SignInCancelTarget | undefined;
/**
 * Handles a click on a sign-in prompt's Cancel button in the background.
 * Returns false for any other interaction.
 */
export declare function dispatchSignInCancel(raw: Record<string, unknown>, ctx: {
    readonly from: ChannelFrom<SlackChannelState>;
    readonly waitUntil: (task: Promise<unknown>) => void;
}): boolean;
