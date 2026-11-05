/**
 * Slack HITL widget rendering + click-decode helpers.
 *
 * Wire format: select-style HITL widgets mint `action_id =
 * ANSWER_ACTION_PREFIX + requestId`. Button widgets add a stable suffix so
 * every button in the same Slack actions block has a unique `action_id`.
 * The decoder requires that suffix for button payloads.
 *
 * Buttons surface the selected option on `action.value`; radio and
 * static selects surface it on `selected_option.value`. The decoder
 * picks whichever is set so the renderer can pick a widget kind on
 * UX grounds without changing the read path.
 */
import type { BlockKitBlock } from "#public/channels/slack/blocks.js";
import type { SlackInteractionCardParts } from "#public/channels/slack/renderers.js";
import { type Answer, type ValidatedAnswer } from "#shared/input.js";
import type { Interaction } from "#channel/interaction-prompts.js";
import type { SlackSessionTarget } from "#public/channels/slack/slackChannel.js";
/**
 * Wire-format prefix every framework HITL widget mints onto its
 * `action_id`. Exposed so end-user adapters that render their own
 * interactive widgets can avoid collisions.
 */
export declare const ANSWER_ACTION_PREFIX = "eve_input:";
/**
 * `action_id` prefix for the "Type your answer" button that opens a
 * freeform-answer modal. Splitting the prefix from {@link ANSWER_ACTION_PREFIX}
 * lets the route handler differentiate "this click is a final answer"
 * (resolve via `answers`) from "this click needs a modal first"
 * (call `views.open`, then resolve on `view_submission`).
 */
export declare const HITL_FREEFORM_ACTION_PREFIX = "eve_input_freeform:";
/**
 * `view.callback_id` carried on the freeform-answer modal. Used to
 * route the inbound `view_submission` back to this channel.
 */
export declare const HITL_FREEFORM_MODAL_CALLBACK_ID = "eve_input_freeform_submit";
/**
 * `block_id` of the modal's text-input block — the route reads the
 * submitted text out of `view.state.values[block_id][action_id]`.
 */
export declare const HITL_FREEFORM_MODAL_BLOCK_ID = "eve_freeform_block";
/**
 * `action_id` of the text input inside the freeform answer modal.
 */
export declare const HITL_FREEFORM_MODAL_ACTION_ID = "eve_freeform_text";
/** Slack session a routed HITL widget answers back to. */
export type SlackHitlRoute = SlackSessionTarget;
/**
 * Subset of one Slack interactivity action the HITL decoder reads.
 * Mirrors the relevant fields of `SlackInteractionAction`.
 */
export interface SlackHitlAction {
    readonly actionId: string;
    /** `value` field on Slack `button` payloads. */
    readonly value?: string;
    /** `selected_option.value` field on radio / static-select payloads. */
    readonly selectedOptionValue?: string;
}
/**
 * Resolved HITL response derived from one Slack interactivity action.
 * Slack-local classification stays beside the eve input response so
 * presentation metadata cannot cross the durable session-inbox boundary.
 */
export interface DerivedHitlResponse {
    readonly kind?: "tool-approval";
    readonly response: Answer;
    readonly route?: SlackHitlRoute;
}
/** A derived response whose input response already passed schema validation. */
interface ValidatedHitlResponse extends DerivedHitlResponse {
    readonly response: ValidatedAnswer;
}
interface DecodedHitlActionId {
    button: boolean;
    kind?: "tool-approval";
    requestId: string;
    route?: SlackHitlRoute;
}
/**
 * Decodes one Slack interactivity action on a widget from
 * {@link renderInteractionBlocks} into an HITL response, or returns `null`
 * when the action does not match an HITL widget eve rendered.
 */
export declare const answerFromSlackAction: (action: SlackHitlAction) => DerivedHitlResponse | null;
/** {@link answerFromSlackAction}, keeping the validated type `respond()` accepts. */
export declare function decodeHitlResponse(action: SlackHitlAction): ValidatedHitlResponse | null;
/**
 * Returns `true` when the action id was minted by an HITL widget the
 * framework rendered. Used by the channel route to split inbound
 * clicks into the HITL path vs. the user-owned `onInteraction` path.
 */
export declare function isHitlAction(actionId: string): boolean;
/** Decodes the framework-owned identity and optional return route from one action id. */
export declare function decodeHitlActionId(actionId: string): DecodedHitlActionId | null;
/**
 * Renders one `Interaction` as Block Kit blocks. Clicks on the rendered
 * widgets decode with {@link answerFromSlackAction}:
 *
 * - `display === "select"` with ≤ {@link RADIO_SELECT_OPTION_LIMIT}
 *   options → `radio_buttons`. Single-click answer, options stay
 *   visible.
 * - `display === "select"` with more options → `static_select`
 *   dropdown so the picker stays scrollable.
 * - Anything else with options → Slack `card` blocks with action
 *   buttons. Best for visually distinct choices (allow / cancel /
 *   cancel).
 * - No options (or `allowFreeform: true`) → a single "Type your answer"
 *   button that opens a Slack modal with a plain_text_input. The modal
 *   submission comes back as a `view_submission` webhook the channel
 *   resolves into an {@link Answer} carrying `text`.
 *
 * Always emits at least the prompt section.
 */
export declare function renderInteractionBlocks(request: Interaction, route?: SlackHitlRoute): BlockKitBlock[];
/**
 * Splits approval details from their interactive controls. Slack includes the
 * originating message in `block_actions`, so putting large tool input beside
 * the buttons makes the callback body grow with model-authored input.
 */
export declare function renderInteractionPostParts(request: Interaction, route?: SlackHitlRoute): SlackInteractionCardParts;
/**
 * Creates the fallback text for one HITL request. Slack clients use this
 * outside the rich Block Kit surface, so include the same approval details
 * that appear in the blocks.
 */
export declare function formatInteractionFallbackText(request: Interaction): string;
/**
 * Metadata round-tripped on the freeform-answer modal's
 * `private_metadata` field. Threaded from the button click that opens
 * the modal to the `view_submission` that closes it so the route can
 * deliver the answer back to the right session.
 */
export type HitlFreeformModalMetadata = SlackSessionTarget & {
    readonly continuationToken: string;
    /** Workspace whose app installation supplies credentials for modal follow-up API calls. */
    readonly installationTeamId?: string;
    /** Slack conversation containing the interactive card. */
    readonly messageChannelId?: string;
    readonly messageTs: string;
    readonly requestId: string;
};
/**
 * Builds the `views.open` payload for the freeform-answer modal. The
 * triggering `prompt` is preserved as a header section so the user can
 * re-read what they're answering inside the modal. `prompt` is the posted
 * card's mrkdwn, which was escaped when the card was rendered.
 *
 * Title is auto-truncated to the Slack modal-title limit.
 */
export declare function buildFreeformModalView(input: {
    readonly metadata: HitlFreeformModalMetadata;
    readonly prompt?: string;
}): Record<string, unknown>;
/**
 * True when an `action_id` was minted by the framework's freeform-answer
 * button (the click that opens a modal — not the final answer).
 */
export declare function isFreeformAction(actionId: string): boolean;
export declare function decodeFreeformHitlActionId(actionId: string): DecodedHitlActionId | null;
/**
 * Renders the "answered" replacement blocks for a previously-posted
 * HITL card. Preserves the original prompt/detail blocks (so context
 * stays visible), appends a confirmation line naming the chosen answer,
 * and attributes the click to the user when their id is known.
 *
 * Slack's `chat.update` replaces every block in one shot, so the caller
 * passes the full list to `blocks` and the rendered fallback text to
 * `text`.
 */
export declare function buildAnsweredBlocks(input: {
    readonly promptBlocks: readonly unknown[];
    readonly answerLabel: string;
    readonly userId?: string;
}): unknown[];
export {};
