import type { SessionHistoryMessage } from "#shared/session-history.js";
import type { TeamsChannelCredentials } from "#public/channels/teams/credentials.js";
export type { TeamsChannelCredentials } from "#public/channels/teams/credentials.js";
import type { ChannelEventContext, ChannelEventOf } from "#public/definitions/channel.js";
import type { SessionEvent } from "#protocol/session-event.js";
import type { TeamsInstrumentationMetadata } from "#public/channels/teams/index.js";
import type { SessionAuthContext, TurnPolicy } from "#channel/types.js";
import type { ChannelContinuationOps } from "#public/definitions/channel.js";
import { type TeamsFilesConfig } from "#public/channels/teams/attachments.js";
import { type TeamsApiOptions, type TeamsApiResponse, type TeamsChannelAccount, type TeamsMention, type TeamsMessageBody, type TeamsOutboundActivity, type TeamsPostedActivity } from "#public/channels/teams/api.js";
import { type TeamsInvokeActivity, type TeamsMessageActivity } from "#public/channels/teams/inbound.js";
import { type JsonObject } from "#shared/json.js";
import { type Channel } from "#public/definitions/channel.js";
import type { InteractionOption } from "#protocol/session-events/families/interaction.js";
/** Pre-dispatch Teams context passed to invoke hooks. */
export interface TeamsContext {
    readonly teams: TeamsHandle;
    readonly thread: TeamsThread;
}
/** Message-scoped context handed to `teamsChannel({ onMessage })`. */
export interface TeamsInboundMessageContext extends TeamsContext {
    /** Returns whether this message belongs to a thread with an active eve session. */
    isSubscribed(): Promise<boolean>;
}
/** Channel-owned Teams context returned by `context()`. */
export interface TeamsChannelContext extends TeamsContext {
    readonly adaptiveCardVersion: string;
    state: TeamsChannelState;
}
/** Event-handler Teams context, including continuation routing. */
export interface TeamsEventContext extends TeamsChannelContext, ChannelContinuationOps {
}
/** A posted question or approval card, kept until eve resolves its request. */
export interface TeamsPendingPromptCard {
    readonly activityId: string;
    /** A question's options, so its card can show the chosen label. */
    readonly options?: readonly Pick<InteractionOption, "id" | "label">[];
    readonly prompt: string;
}
/** JSON-serializable Teams channel state. */
export interface TeamsChannelState {
    /** Bot account captured from the inbound activity recipient. */
    bot: TeamsChannelAccount | null;
    channelId: string | null;
    conversationId: string | null;
    /** Teams conversation type (`personal`, `groupChat`, `channel`, or platform value). */
    conversationType: string | null;
    /** Activity id used for thread replies in channel/group contexts. */
    replyToActivityId: string | null;
    serviceUrl: string | null;
    teamId: string | null;
    tenantId: string | null;
    /** User account that triggered the latest turn/session. */
    triggeringUser: TeamsChannelAccount | null;
    /**
     * Teams account behind each principal that sent a message or answer. The
     * default handlers name who decided an approval and whom a sign-in is for.
     */
    approvalResponderAccounts?: Record<string, TeamsChannelAccount>;
}
/** Teams channel credentials. */
/**
 * Target accepted by `receive(teams, { target })` for proactive sessions.
 * `serviceUrl` and `conversationId` are required. Mutually exclusive:
 * `replyToActivityId` threads onto an existing activity, `initialMessage` posts
 * a new root that anchors non-personal threads.
 */
export interface TeamsReceiveTarget {
    /** Teams team/channel id, for channel conversations. */
    readonly channelId?: string;
    readonly conversationId: string;
    /** Teams conversation type (`personal`, `groupChat`, `channel`, or platform value). */
    readonly conversationType?: string;
    /** Root message posted before the session message. */
    readonly initialMessage?: string | TeamsMessageBody;
    /** Existing activity id to thread replies onto. */
    readonly replyToActivityId?: string;
    readonly serviceUrl: string;
    /** Teams team id, when targeting a team channel. */
    readonly teamId?: string;
    /** Teams tenant id, when known. */
    readonly tenantId?: string;
}
/** Result of an inbound Teams message hook. Return `null` to acknowledge without dispatching. */
export type TeamsInboundResult = {
    readonly auth: SessionAuthContext | null;
    readonly context?: readonly string[];
    /** Prior conversation added as user and assistant turns before this message. */
    readonly history?: readonly SessionHistoryMessage[];
    /** Overrides the workflow run title without changing the message sent to the model. */
    readonly title?: string;
} | null;
/** Sync or async {@link TeamsInboundResult}. */
/** Result of a Teams HITL submission authorization hook. Return `null` to reject. */
export type TeamsAnswerResult = {
    readonly auth: SessionAuthContext | null;
} | null;
/** Result of a non-HITL Teams invoke hook. A `Response` returns verbatim, a plain object is JSON-encoded as the body, and `null`/`undefined` yields a 200 OK. */
export type TeamsInvokeResult = Record<string, unknown> | Response | null | undefined;
/** Sync or async {@link TeamsInvokeResult}. */
type TeamsEventHandler<T extends SessionEvent["type"]> = (event: ChannelEventOf<T>, ctx: ChannelEventContext<TeamsEventContext>) => void | Promise<void>;
/** Event handlers supported by `teamsChannel({ events })`. */
export interface TeamsChannelEvents {
    readonly "interaction.opened"?: TeamsEventHandler<"interaction.opened">;
    readonly "interaction.settled"?: TeamsEventHandler<"interaction.settled">;
    readonly "turn.started"?: TeamsEventHandler<"turn.started">;
    readonly "call.requested"?: TeamsEventHandler<"call.requested">;
    readonly "call.progress"?: TeamsEventHandler<"call.progress">;
    readonly "call.settled"?: TeamsEventHandler<"call.settled">;
    readonly "content.completed"?: TeamsEventHandler<"content.completed">;
    readonly "content.delta"?: TeamsEventHandler<"content.delta">;
    readonly "turn.settled"?: TeamsEventHandler<"turn.settled">;
    readonly "session.ended"?: TeamsEventHandler<"session.ended">;
    readonly "delivery.settled"?: TeamsEventHandler<"delivery.settled">;
}
/** Configuration for {@link teamsChannel}. */
export interface TeamsChannelConfig {
    /** Adaptive Card schema version emitted for HITL input and connection-auth cards. Defaults to `"1.5"`. */
    readonly adaptiveCardVersion?: string;
    /** Shared Connector API options (fetch override, login base URL). Credentials come from {@link credentials}. */
    readonly api?: Omit<TeamsApiOptions, "credentials">;
    /** Bot Connector credentials (app id/password, tenant id, custom token provider, or a webhook verifier). Falls back to `MICROSOFT_APP_*`/`TEAMS_APP_*` env vars when omitted. */
    readonly credentials?: TeamsChannelCredentials;
    /** Overrides merged over the built-in event handlers (typing, replies, HITL cards, auth cards, terminal errors). */
    readonly events?: TeamsChannelEvents;
    /** Inbound attachment handling. File ingestion is off unless `enabled: true`. */
    readonly files?: TeamsFilesConfig;
    /** Override the default webhook route path (`/eve/v1/teams`). */
    readonly route?: string;
    /** Policy for accepted messages that arrive while a turn is active. */
    readonly turnPolicy?: TurnPolicy;
    /** Inbound message hook. Defaults to user-scoped auth and mention-gated dispatch outside personal chats. */
    onMessage?(ctx: TeamsInboundMessageContext, message: TeamsMessageActivity): TeamsInboundResult | Promise<TeamsInboundResult>;
    /** Authorizes HITL card submissions. Defaults to the submitting Teams user. */
    onAnswers?(ctx: TeamsContext, activity: TeamsInvokeActivity | TeamsMessageActivity): TeamsAnswerResult | Promise<TeamsAnswerResult>;
    /** Handler for non-HITL Teams invoke activities. Return a body, a Response, or `null`/`undefined` for a 200 OK. */
    onInvoke?(ctx: TeamsContext, activity: TeamsInvokeActivity): TeamsInvokeResult | Promise<TeamsInvokeResult>;
}
/** Low-level Teams handle exposed to hooks and event handlers. */
export interface TeamsHandle {
    readonly channelId: string | undefined;
    readonly conversationId: string;
    readonly conversationType: string | undefined;
    readonly replyToActivityId: string | undefined;
    readonly serviceUrl: string;
    readonly teamId: string | undefined;
    readonly tenantId: string | undefined;
    /** Raw Bot Connector API escape hatch. */
    request(path: string, body: TeamsOutboundActivity | JsonObject, options?: TeamsRequestOptions): Promise<TeamsApiResponse>;
    /** Sends a Bot Framework activity to the current conversation. */
    sendActivity(activity: TeamsMessageBody | TeamsOutboundActivity | string): Promise<TeamsPostedActivity>;
    /** Sends a Bot Framework reply to the current thread anchor. Throws if no anchor is set (e.g. personal chats); use {@link sendActivity} there. */
    replyToActivity(activity: TeamsMessageBody | TeamsOutboundActivity | string): Promise<TeamsPostedActivity>;
    updateActivity(activityId: string, activity: TeamsMessageBody | TeamsOutboundActivity | string): Promise<TeamsPostedActivity>;
    /** Triggers Teams' typing indicator. The thread helper ignores failures. */
    startTyping(): Promise<void>;
}
/** Conversation-scoped Teams operations. */
export interface TeamsThread {
    /** Builds a Teams mention entity and matching text for one user. */
    mentionUser(user: {
        readonly id: string;
        readonly name?: string;
    }): TeamsMention;
    post(message: string | TeamsMessageBody): Promise<TeamsPostedActivity>;
    /** Starts Teams' typing indicator. Ignores failures. */
    startTyping(): Promise<void>;
    update(activityId: string, message: string | TeamsMessageBody): Promise<TeamsPostedActivity>;
}
/** Options for {@link TeamsHandle.request}. */
export interface TeamsRequestOptions {
    /** HTTP verb for the raw Connector call. Defaults to `POST`. */
    readonly method?: "DELETE" | "GET" | "POST" | "PUT";
}
/** Concrete return type of {@link teamsChannel}. */
export interface TeamsChannel extends Channel<TeamsChannelState, TeamsReceiveTarget, TeamsInstrumentationMetadata> {
}
/** Teams channel factory for Bot Framework Activities and proactive messages. */
export declare function teamsChannel(config?: TeamsChannelConfig): TeamsChannel;
