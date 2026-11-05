/**
 * Teams Adaptive Card rendering and decode helpers for eve HITL prompts.
 */
import { type ValidatedAnswer } from "#shared/input.js";
import type { Interaction } from "#channel/interaction-prompts.js";
import type { TeamsActivity } from "#public/channels/teams/inbound.js";
import type { TeamsAttachment, TeamsMessageBody } from "#public/channels/teams/api.js";
import { type JsonObject } from "#shared/json.js";
/** Adaptive Card attachment content type used by Teams. */
export declare const TEAMS_ADAPTIVE_CARD_CONTENT_TYPE = "application/vnd.microsoft.card.adaptive";
/** Hidden data property used by eve HITL Adaptive Card actions. */
export declare const TEAMS_HITL_DATA_KEY = "eve_input";
/** ChoiceSet input id used for select-style HITL requests. */
export declare const TEAMS_HITL_CHOICE_INPUT_ID = "eve_option";
/** Text input id used for freeform HITL requests. */
export declare const TEAMS_HITL_FREEFORM_INPUT_ID = "eve_freeform_text";
/** Request kind carried on approval actions so lifecycle handling can distinguish them from questions. */
export declare const TEAMS_HITL_REQUEST_KIND_KEY = "kind";
/** Prompt carried on approval actions so a response can recover its card record. */
export declare const TEAMS_HITL_PROMPT_KEY = "prompt";
/** Renders one input request as a Teams message body containing an Adaptive Card. */
export declare function renderInteractionMessage(request: Interaction, options?: {
    readonly adaptiveCardVersion?: string;
    readonly replyToActivityId?: string;
}): TeamsMessageBody;
/**
 * Renders one input request as a Teams Adaptive Card attachment.
 * `options.adaptiveCardVersion` sets the card schema version (default "1.5").
 * Long prompt, choice, and action text is truncated to Teams card limits.
 */
export declare function renderInteractionAttachment(request: Interaction, options?: {
    readonly adaptiveCardVersion?: string;
    readonly replyToActivityId?: string;
}): TeamsAttachment;
/** Renders an answered Teams card that replaces a pending HITL prompt. */
export declare function renderAnsweredInteractionMessage(input: {
    readonly includeText?: boolean;
    readonly label?: string;
    readonly prompt: string;
}): TeamsMessageBody;
/**
 * Renders the card that replaces a prompt no session can answer anymore: its
 * prompt, then `label`, as the session would have resolved it.
 */
export declare function renderInactiveInputRequestMessage(prompt: string | undefined, label: string): TeamsMessageBody;
/** Returns true when a Teams activity carries an eve HITL submit payload. */
export declare function isTeamsAnswerActivity(activity: TeamsActivity): boolean;
/** Returns whether an eve HITL activity answers a tool approval. */
export declare function isTeamsToolApprovalResponseActivity(activity: TeamsActivity): boolean;
/** Reads the original prompt from a tool-approval submit activity. */
export declare function readTeamsToolApprovalPrompt(activity: TeamsActivity): string | undefined;
/** Reads the prompt a submit activity answers, which every eve card carries in its submit data. */
export declare function readTeamsInputPrompt(activity: TeamsActivity): string | undefined;
/**
 * Decodes the eve HITL submit payload from a Teams activity. Returns a single
 * `Answer` (option selection, freeform text, or a bare requestId
 * acknowledgement), or an empty array when the activity has no recognizable
 * HITL payload or requestId.
 */
export declare function deriveTeamsAnswers(activity: TeamsActivity): readonly ValidatedAnswer[];
/**
 * Builds the HTTP body Teams expects after an Adaptive Card invoke action.
 * Defaults to statusCode 200 and message "Answer received."; `type` is always
 * the Teams activity-message content type.
 */
/** Reads the recorded thread root carried by an eve HITL card submission. */
export declare function readTeamsInputReplyToActivityId(activity: TeamsActivity): string | null;
export declare function teamsInvokeResponse(input?: {
    readonly message?: string;
    readonly statusCode?: number;
}): JsonObject;
