import { type RequestSettlement } from "#channel/interaction-prompts.js";
import type { Interaction } from "#channel/interaction-prompts.js";
/**
 * Renders pending input requests as a Chat SDK card with one button per option,
 * plus fallback text for adapters without cards (such as Photon iMessage). A
 * request in `resolved` shows its outcome in place of its buttons.
 */
export declare function renderInteractions(requests: readonly Interaction[], inputActionPrefix: string, resolved?: Readonly<Record<string, RequestSettlement>>): {
    card: import("#compiled/chat/index.js").CardElement;
    fallbackText: string;
};
/** Renders a request card whose prompt is unknown as only how it ended. */
export declare function renderRetiredInputRequest(label: string): {
    card: import("#compiled/chat/index.js").CardElement;
    fallbackText: string;
};
/** Decodes a default eve HITL button action back into an input response. */
export declare function decodeInputAction(actionId: string, prefix: string, value: string | undefined): {
    interactionId: string;
    optionId: string;
} | null;
