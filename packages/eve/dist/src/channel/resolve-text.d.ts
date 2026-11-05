import type { InteractionRequest } from "#protocol/session-events/families/interaction.js";
import type { Answer } from "#shared/input.js";
/** An interaction plain text answers: an interaction row, or an approval the session asked. */
interface TextResolvable {
    readonly interactionId: string;
    readonly request: Pick<InteractionRequest, "allowFreeform" | "options">;
}
/**
 * Renders a request's prompt and numbered options as the plain text that
 * {@link answerFromText} parses, so a reply with the number, label, or
 * id answers it. Channels append their own reply instructions.
 */
export declare function renderTextInteraction(request: Pick<InteractionRequest, "options" | "prompt">): string;
/**
 * Maps freeform text to an {@link Answer} to one interaction.
 *
 * Resolution order:
 * 1. Exact option ID (case-insensitive)
 * 2. Exact option label (case-insensitive)
 * 3. 1-based numeric index into the options array
 * 4. Freeform text when the request allows freeform answers or the
 *    request has no options
 */
export declare function answerFromText(text: string, interaction: TextResolvable): Answer | undefined;
export {};
