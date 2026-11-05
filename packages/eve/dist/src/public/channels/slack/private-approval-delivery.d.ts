import type { SlackHandle } from "#public/channels/slack/api.js";
import type { BlockKitBlock } from "#public/channels/slack/blocks.js";
import { type RenderedRequestCard } from "#public/channels/slack/request-card-render.js";
type PrivateApprovalSlack = Pick<SlackHandle, "channelId" | "request" | "threadTs">;
/** Where a direct-message request's messages landed. */
export interface PrivateInteractionDelivery {
    readonly channelId: string;
    readonly ts: string;
    readonly detailsTs?: string;
    /** The controls blocks posted: the rendered ones, or eve's default if Slack rejected them. */
    readonly blocks: readonly BlockKitBlock[];
}
/**
 * Posts one rendered request to `reviewer`'s DM: a permalink to the thread, its details, then
 * its controls. A failure deletes what it posted, so a reviewer never sees half a request.
 */
export declare function deliverPrivateInteraction(input: {
    readonly previewMessageTs: string;
    readonly card: RenderedRequestCard;
    readonly reviewer: string;
    readonly slack: PrivateApprovalSlack;
}): Promise<PrivateInteractionDelivery>;
export {};
