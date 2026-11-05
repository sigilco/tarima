/** Derives inbound mrkdwn from top-level text plus Block Kit and legacy attachments. */
export declare function resolveSlackInboundMrkdwn(text: string, raw: Record<string, unknown>): string;
/** Reads the `text` string from a Slack composition text object (`{ text: "..." }`). */
export declare function readSlackTextObject(textObject: unknown): string;
