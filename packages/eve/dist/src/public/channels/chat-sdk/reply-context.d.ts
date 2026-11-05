/** What a channel knows about the earlier message a person replied to. */
export interface QuotedMessage {
    /** Platform id of the replied-to message. */
    readonly id: string;
    /** Text of the replied-to message, when the platform supplies it. */
    readonly text?: string;
    /** Whether the agent sent the replied-to message, when the platform says. */
    readonly fromAgent?: boolean;
}
/**
 * Renders a `context` entry telling the model that the person's message is a
 * reply to an earlier message, and what that message said. Messaging apps show
 * the quote above the reply; without this the model sees only the reply.
 */
export declare function formatReplyContext(quoted: QuotedMessage, reply: string): string;
