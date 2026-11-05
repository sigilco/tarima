import type { SessionHistoryMessage } from "#shared/session-history.js";
import type { ChannelEventContext, ChannelEventOf, CommittedLine } from "#public/definitions/channel.js";
import type { SessionEvent } from "#protocol/session-event.js";
import type { PromptQueueState } from "#channel/prompt-queue.js";
import type { SessionAuthContext, TurnPolicy } from "#channel/types.js";
import { createLinearAgentActivity, listLinearAgentSessionActivities, updateLinearAgentSession, type LinearApiOptions } from "#public/channels/linear/api.js";
import type { LinearChannelCredentials } from "#public/channels/linear/auth.js";
import { type LinearAgentSessionEvent, type LinearAgentSessionRef, type LinearDataWebhookEvent, type LinearDelivery } from "#public/channels/linear/inbound.js";
import { type Channel, type ChannelContinuationOps } from "#public/definitions/channel.js";
import type { JsonObject } from "#shared/json.js";
/** JSON-serializable state for one Linear Agent Session conversation. */
export interface LinearChannelState extends PromptQueueState {
    readonly agentSessionId: string | null;
    readonly agentSessionUrl?: string | null;
    readonly commentId?: string | null;
    readonly issueId?: string | null;
    readonly issueIdentifier?: string | null;
    readonly issueTitle?: string | null;
    readonly issueUrl?: string | null;
    readonly organizationId?: string | null;
    readonly sourceCommentId?: string | null;
}
/** Per-session instrumentation snapshot for Linear runtime telemetry. */
export interface LinearInstrumentationMetadata extends Record<string, unknown> {
    readonly agentSessionId: string | null;
    readonly commentId: string | null;
    readonly issueId: string | null;
    readonly issueIdentifier: string | null;
    readonly organizationId: string | null;
}
/** Target accepted by `receive(linear, { target })` for proactive Linear sessions. */
export type LinearReceiveTarget = {
    readonly agentSessionId: string;
    readonly initialActivity?: string;
} | {
    readonly externalLink?: string;
    readonly externalUrls?: readonly {
        readonly label: string;
        readonly url: string;
    }[];
    readonly initialActivity?: string;
    readonly issueId: string;
} | {
    readonly commentId: string;
    readonly externalLink?: string;
    readonly externalUrls?: readonly {
        readonly label: string;
        readonly url: string;
    }[];
    readonly initialActivity?: string;
};
/** Pre-dispatch Linear context passed to inbound hooks. */
export interface LinearSessionContext {
    readonly delivery: LinearDelivery;
    readonly linear: LinearHandle;
    readonly session: LinearAgentSessionRef;
}
/** Channel-owned Linear context rebuilt from persisted channel state. */
export interface LinearChannelContext {
    readonly linear: LinearHandle;
    state: LinearChannelState;
}
/** Event-handler Linear context, including continuation routing. */
export interface LinearEventContext extends LinearChannelContext, ChannelContinuationOps {
}
/** Low-level Linear handle exposed to hooks and event handlers. */
export interface LinearHandle {
    readonly agentSessionId: string;
    createActivity(content: Parameters<typeof createLinearAgentActivity>[0]["activity"]["content"], options?: {
        readonly ephemeral?: boolean;
        readonly signal?: Parameters<typeof createLinearAgentActivity>[0]["activity"]["signal"];
        readonly signalMetadata?: JsonObject;
    }): Promise<{
        readonly id: string;
        readonly success: boolean;
    }>;
    listActivities(options?: {
        readonly last?: number;
    }): Promise<Awaited<ReturnType<typeof listLinearAgentSessionActivities>>>;
    updateSession(update: Parameters<typeof updateLinearAgentSession>[0]["update"]): Promise<{
        readonly success: boolean;
    }>;
}
type LinearEventHandler<T extends SessionEvent["type"]> = (event: ChannelEventOf<T>, ctx: ChannelEventContext<LinearEventContext>) => void | Promise<void>;
/** Event handlers supported by `linearChannel({ events })`. */
export interface LinearChannelEvents {
    /** Runs once per committed line; eve's default shows the request a reply answers now. */
    readonly committed?: (line: CommittedLine, ctx: ChannelEventContext<LinearEventContext>) => void | Promise<void>;
    readonly "turn.started"?: LinearEventHandler<"turn.started">;
    readonly "call.requested"?: LinearEventHandler<"call.requested">;
    readonly "call.progress"?: LinearEventHandler<"call.progress">;
    readonly "call.settled"?: LinearEventHandler<"call.settled">;
    readonly "content.completed"?: LinearEventHandler<"content.completed">;
    readonly "content.delta"?: LinearEventHandler<"content.delta">;
    readonly "interaction.opened"?: LinearEventHandler<"interaction.opened">;
    readonly "interaction.settled"?: LinearEventHandler<"interaction.settled">;
    readonly "response.admitted"?: LinearEventHandler<"response.admitted">;
    readonly "turn.settled"?: LinearEventHandler<"turn.settled">;
    readonly "session.ended"?: LinearEventHandler<"session.ended">;
    readonly "delivery.settled"?: LinearEventHandler<"delivery.settled">;
}
/**
 * Result of an inbound Linear hook. Return `null` to acknowledge without
 * dispatching; return `{ auth }` to dispatch. Optional `context` strings are
 * added as `role: "user"` messages before the dispatched turn.
 */
export type LinearInboundResult = {
    readonly auth: SessionAuthContext | null;
    readonly context?: readonly string[];
    /** Prior conversation added as user and assistant turns before this message. */
    readonly history?: readonly SessionHistoryMessage[];
    /** Overrides the workflow run title without changing the message sent to the model. */
    readonly title?: string;
} | null;
/** Sync or async {@link LinearInboundResult}. */
/** Configuration for {@link linearChannel}. */
export interface LinearChannelConfig {
    readonly api?: LinearApiOptions;
    readonly credentials?: LinearChannelCredentials;
    readonly events?: LinearChannelEvents;
    /** Max allowed webhook timestamp skew in milliseconds. Defaults to 60 seconds. */
    readonly maxSkewMs?: number;
    readonly route?: string;
    /** Policy for accepted messages that arrive while a turn is active. */
    readonly turnPolicy?: TurnPolicy;
    /** Inbound Agent Session hook. Defaults to dispatching `created` and `prompted` events. */
    onAgentSession?(ctx: LinearSessionContext, event: LinearAgentSessionEvent): LinearInboundResult | Promise<LinearInboundResult>;
    /** Optional hook for generic Linear data webhooks sent to the same route. */
    onDataWebhook?(event: LinearDataWebhookEvent): void | Promise<void>;
}
/** Concrete return type of {@link linearChannel}. */
export interface LinearChannel extends Channel<LinearChannelState, LinearReceiveTarget, LinearInstrumentationMetadata> {
}
/** Linear channel factory for Linear Agent Session webhooks and Agent Activities. */
export declare function linearChannel(config?: LinearChannelConfig): LinearChannel;
export {};
