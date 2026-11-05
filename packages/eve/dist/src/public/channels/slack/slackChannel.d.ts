import type { ChannelEventContext, ChannelEventOf, CommittedLine } from "#public/definitions/channel.js";
import type { SessionEvent } from "#protocol/session-event.js";
import type { MessageContent } from "#shared/message-content.js";
import { type SessionSendOptions } from "#channel/session.js";
import type { ChannelResolveSession, ChannelSource } from "#channel/channel-operations.js";
import type { Delivery } from "#shared/delivery.js";
import type { SessionAuthContext, TurnPolicy } from "#channel/types.js";
import type { VercelConnectMetadata } from "#shared/vercel-connect-metadata.js";
import type { BlockKitBlock } from "#public/channels/slack/blocks.js";
import type { SlackHitlRoute } from "#public/channels/slack/hitl.js";
import type { SessionContext } from "#public/definitions/callback-context.js";
import type { SessionHistoryMessage } from "#shared/session-history.js";
import type { ChannelContinuationOps } from "#public/definitions/channel.js";
import type { Answer, StrictAnswers, ValidatedAnswer } from "#shared/input.js";
import type { Interaction } from "#channel/interaction-prompts.js";
import { type SlackBotToken, type SlackHandle, type SlackThread, type SlackPostInput, type SlackWorkspaceHandle } from "#public/channels/slack/api.js";
import { type SlackTransportOptions } from "#public/channels/slack/transport.js";
import { type SlackRenderedEvent, type SlackRenderer } from "#public/channels/slack/renderers.js";
import { type SlackEvent, type SlackEventEnvelope, type SlackMessage, type SlackMessageEdit } from "#public/channels/slack/inbound.js";
import { type SlackUsersOption } from "#public/channels/slack/user-info.js";
import { type LoadThreadContextMessagesOptions } from "#public/channels/slack/thread.js";
import { type SlackSessionOperations } from "#public/channels/slack/session-operations.js";
import { type UploadPolicyInput } from "#public/channels/upload-policy.js";
import { type SlackWebhookVerifier } from "#public/channels/slack/verify.js";
import { type UndeliveredReplyState } from "#public/channels/undelivered-reply.js";
import { type Channel } from "#public/definitions/channel.js";
import { type ChannelAudience } from "#shared/channel-audience.js";
export type { SlackRespondOptions, SlackSendOptions, SlackSessionOperations, } from "#public/channels/slack/session-operations.js";
/**
 * Base Slack context for inbound webhook handlers. These hooks run before the
 * runtime hydrates session state, so `state` is absent here.
 * {@link thread} owns thread-scoped operations (`post`, `postEphemeral`,
 * `startTyping`, `refresh`, `listParticipants`, `recentMessages`,
 * `mentionUser`); {@link slack} owns Slack identity (`channelId`, `threadTs`,
 * `teamId`) plus the raw-API escape hatch (`request`, `uploadFiles`).
 */
export interface SlackContext {
    readonly thread: SlackThread;
    readonly slack: SlackHandle;
}
/**
 * {@link SlackContext} plus the persisted per-session
 * {@link SlackChannelState}. Built by the channel's `context()` hook and
 * extended by {@link SlackEventContext}.
 */
export interface SlackChannelContext extends SlackContext {
    state: SlackChannelState;
}
/**
 * Slack context handed to `events[type]` handlers. Extends
 * {@link SlackChannelContext} (`thread`, `slack`, hydrated `state`) with
 * continuation routing ({@link ChannelContinuationOps}). Unlike the pre-dispatch
 * {@link SlackContext}, `state` is hydrated here.
 */
export interface SlackEventContext extends SlackChannelContext, ChannelContinuationOps {
}
export type { SlackApiResponse, SlackBotToken, SlackHandle, SlackThread, SlackWorkspaceHandle, } from "#public/channels/slack/api.js";
export type { SlackWebhookVerifier } from "#public/channels/slack/verify.js";
type SlackEventHandler<T extends SessionEvent["type"]> = (event: ChannelEventOf<T>, ctx: ChannelEventContext<SlackEventContext>) => void | Promise<void>;
/**
 * Delivery surface handed to a renderer's sign-in `interaction.opened` handler. The
 * connection challenge is a credential: anyone who completes the sign-in
 * binds their identity to this session's connection. So the only
 * delivery capabilities here are private ones, an ephemeral reply in the
 * thread or a direct message. There is deliberately no public `post`,
 * no raw `slack.request` escape hatch, and no full thread handle. An
 * override can change the words, not the audience.
 */
export interface SlackAuthorizationEventContext {
    /**
     * Ephemeral message in the current thread, visible only to `userId`.
     * Same contract as {@link SlackThread.postEphemeral}.
     */
    readonly postEphemeral: SlackThread["postEphemeral"];
    /**
     * Direct message to `userId`'s IM conversation with the bot. Same
     * contract as {@link SlackThread.postDirectMessage} (requires the
     * `im:write` scope).
     */
    readonly postDirectMessage: SlackThread["postDirectMessage"];
    /**
     * Hydrated per-session channel state. Resolve the recipient with
     * `slackUsersByPrincipal[eventData.principalId]`.
     */
    readonly state: SlackChannelState;
}
/** One request's controls in a posted card message. */
export interface SlackInteractionCardRequest {
    readonly interactionId: string;
    /** The controls blocks the message shows for this request now. */
    readonly blocks: readonly BlockKitBlock[];
    /** The separate details message, deleted once every request it covers settled. */
    readonly detailsTs?: string;
    /**
     * Set once eve sent the request's settled rendering, even if Slack refused it, so a failed
     * update is never retried forever. The message is forgotten once every request has it.
     */
    readonly settled?: true;
}
/** A message eve posted holding the controls of one or more input requests. */
export interface SlackInteractionCardRecord {
    /** The message's conversation: the session's channel, or the reviewer's DM. */
    readonly channelId: string;
    readonly ts: string;
    readonly destination: SlackApprovalChannel;
    /** The session a card's controls answer back to: a direct message's thread, or a code channel. */
    readonly route?: SlackHitlRoute;
    /** Thread post announcing a direct-message request; updated with the outcome. */
    readonly announcementTs?: string;
    readonly requests: readonly SlackInteractionCardRequest[];
}
/**
 * JSON-serializable per-session state, stored verbatim across workflow
 * step boundaries. Anything written here must round-trip through
 * `JSON.stringify` / `JSON.parse`.
 */
export interface SlackChannelState extends UndeliveredReplyState {
    /** Audience classification captured before the session is dispatched. */
    audience?: ChannelAudience;
    /** Slack channel id seeded by the inbound mention. */
    channelId: string | null;
    /** Slack thread root ts; `null` in a code channel, which is one session across its threads. */
    threadTs: string | null;
    /** Whether this session serves a Slack code channel. */
    codeChannel?: boolean;
    /** Slack team id, when the inbound event carried one. */
    teamId: string | null;
    /** Slack message ts that triggered the active turn. */
    triggeringMessageTs?: string | null;
    /** Slack workspace whose app installation supplies this session's credentials. */
    installationTeamId?: string | null;
    /**
     * Slack user id of the actor that triggered the current session/turn.
     * A later message can change it, so sign-in and approval handlers address
     * recipients through `slackUsersByPrincipal` instead.
     */
    triggeringUserId?: string | null;
    /**
     * Principal id to Slack user id, recorded as each message or input response
     * is delivered. Default handlers use it to address the principal named on
     * sign-in `interaction.opened` and approval events.
     */
    slackUsersByPrincipal?: Record<string, string>;
}
/**
 * Per-session metadata attached to tracing spans, projected by the
 * channel's `metadata(state)` hook. Fields mirror the inbound mention
 * (channel, team, thread, triggering user) and are `null` until an inbound
 * event seeds them. Open-ended (`Record<string, unknown>`) so deployments
 * can attach extra span attributes.
 */
export interface SlackInstrumentationMetadata extends Record<string, unknown> {
    readonly channelId: string | null;
    readonly teamId: string | null;
    readonly threadTs: string | null;
    readonly triggeringUserId: string | null;
    /** `true` in a code channel session; absent elsewhere. */
    readonly codeChannel?: true;
}
/**
 * Slack channel credentials: outbound bot token plus inbound webhook
 * verification. Any field may be omitted to fall back to its env-var /
 * signing-secret default.
 */
export interface SlackChannelCredentials {
    /**
     * Bot token for all outbound Slack Web API calls. Function providers receive
     * the app installation workspace id when Slack supplies one. Falls back to
     * `process.env.SLACK_BOT_TOKEN` when omitted.
     */
    readonly botToken?: SlackBotToken;
    /**
     * Signing secret used to HMAC-verify inbound webhook requests. Falls
     * back to `process.env.SLACK_SIGNING_SECRET` when neither this nor
     * `webhookVerifier` is supplied.
     */
    readonly signingSecret?: string;
    /**
     * Custom inbound webhook verifier. When supplied, eve skips the
     * `SLACK_SIGNING_SECRET` fallback and delegates to it. Typically set by
     * integrations (e.g. Connect) that authenticate webhooks out-of-band.
     */
    readonly webhookVerifier?: SlackWebhookVerifier;
    /** Build-time metadata supplied by Vercel Connect credential helpers. */
    readonly vercelConnect?: VercelConnectMetadata;
}
/** Target accepted by `ctx.to(slack, target)` from route and schedule handlers. */
export interface SlackReceiveTarget {
    readonly channelId: string;
    readonly threadTs?: string;
    /**
     * Optional audience for proactive receives. Omit to leave `unknown`.
     * Pass when the caller already knows channel visibility, for example a
     * webhook or schedule that classified the Slack destination before handoff.
     */
    readonly audience?: ChannelAudience;
    /** Slack workspace whose app installation supplies credentials for this send. */
    readonly installationTeamId?: string;
    /**
     * Optional message posted into the Slack channel before the agent runs.
     * The post becomes the thread root and the first turn is threaded under
     * it, giving cross-channel handoffs a visible context anchor. Mutually
     * exclusive with {@link threadTs}.
     */
    readonly initialMessage?: SlackInitialMessage;
    /**
     * Opens a Slack code channel from a message in {@link channelId} and starts
     * the session there, as the code channel's one session. Slack links the
     * channel and the origin message to each other. One requester gets one code
     * channel per origin message, so a repeated send joins that channel's
     * session. Requires `codeChannels: true`. Mutually exclusive with
     * {@link threadTs} and {@link initialMessage}.
     */
    readonly codeChannel?: SlackCodeChannelTarget;
}
/** The code channel `slackChannel().receive` opens for `target.codeChannel`. */
export interface SlackCodeChannelTarget {
    /** Channel name shown in Slack. Omit it to let Slack name the channel from the message. */
    readonly name?: string;
    /** ts of the message the code channel continues. */
    readonly originTs: string;
    /** Thread of the origin message: its own ts when top-level. */
    readonly originThreadTs: string;
}
/**
 * Pre-agent post issued by `slackChannel().receive` when the caller
 * provides `target.initialMessage`. Accepts the same explicit message forms
 * as `ctx.thread.post`: Markdown, text, blocks, or a card, plus optional files.
 *
 * Unlike `thread.post({ text, files })`, which sends one message with the files
 * attached, this posts the root message first and then uploads files as a
 * threaded reply. Upload failures are logged, not thrown, so the run still starts.
 */
export type SlackInitialMessage = SlackPostInput;
/**
 * Options for one turn requested by a generic Slack event handler.
 */
export type SlackEventSendOptions = SessionSendOptions & {
    readonly target: SlackReceiveTarget;
};
/** Options for answering pending input requests from a generic Slack event handler. */
export interface SlackEventRespondOptions {
    readonly auth: SessionAuthContext | null;
    readonly target: SlackSessionTarget;
}
/**
 * Starts a session on the current Slack channel from `onEvent`. Call it zero,
 * one, or many times; each invocation returns the resulting session.
 */
export type SlackEventSendFn = (message: MessageContent, options: SlackEventSendOptions) => Promise<Delivery>;
/** Answers pending input requests on one Slack thread. */
export type SlackEventRespondFn = <const TResponses extends readonly Answer[]>(answers: StrictAnswers<TResponses>, options: SlackEventRespondOptions) => ReturnType<SlackSessionOperations["respond"]>;
/**
 * Slack session identity used by workspace-scoped inbound helpers: a thread,
 * or a code channel, whose one session spans all of its threads.
 */
export type SlackSessionTarget = {
    readonly channelId: string;
    readonly threadTs: string;
    readonly codeChannel?: never;
} | {
    readonly channelId: string;
    readonly codeChannel: true;
    readonly threadTs?: never;
};
/**
 * Imperative surface handed to `slackChannel({ onEvent })`. Generic Events API
 * payloads are not necessarily tied to one thread, so the context exposes a
 * workspace API handle plus Slack-bound operations rather than the
 * thread-scoped {@link SlackContext} used by message handlers.
 */
export interface SlackInboundEventContext {
    /** Starts a turn on this Slack channel using the proactive send contract. */
    readonly send: SlackEventSendFn;
    /** Answers pending input requests on one Slack thread. */
    readonly respond: SlackEventRespondFn;
    /** Cancels the active turn for one Slack thread. */
    cancel(input: {
        readonly target: SlackSessionTarget;
        readonly turnId?: string;
    }): ReturnType<ChannelSource<SlackChannelState>["cancel"]>;
    /** Compacts the current session for one Slack thread. */
    compact(input: {
        readonly target: SlackSessionTarget;
    }): ReturnType<ChannelSource<SlackChannelState>["compact"]>;
    /** Clears the current session for one Slack thread. */
    clear(input: {
        readonly target: SlackSessionTarget;
    }): ReturnType<ChannelSource<SlackChannelState>["clear"]>;
    /** Retires the current session for one Slack thread without creating a replacement. */
    end(input: {
        readonly reason?: string;
        readonly target: SlackSessionTarget;
    }): ReturnType<ChannelSource<SlackChannelState>["end"]>;
    /** Resolves the current session for one Slack thread. */
    resolveSession(input: {
        readonly target: SlackSessionTarget;
    }): ReturnType<ChannelResolveSession>;
    /** The complete signed Events API callback envelope. */
    readonly envelope: SlackEventEnvelope;
    /** Workspace-scoped Slack identity and raw Web API escape hatch. */
    readonly slack: SlackWorkspaceHandle;
    /** Keeps detached handler work alive after the Slack webhook is acknowledged. */
    readonly waitUntil: (task: Promise<unknown>) => void;
}
/**
 * Message-scoped context handed to `onMessage`, `onAppMention`, and
 * `onDirectMessage`.
 */
export interface SlackInboundMessageContext extends SlackContext, SlackSessionOperations {
    /**
     * Returns whether the inbound message belongs to a DM, group DM, or private channel.
     * Unknown conversation types fail closed and return `true`.
     */
    isDMOrPrivateChannel(): Promise<boolean>;
    /** Returns whether this message belongs to a thread with an active eve session. */
    isSubscribed(): Promise<boolean>;
    /**
     * Returns whether the inbound event explicitly mentions this bot. For an edit,
     * returns whether the message mentioned it before or after the edit, so an
     * edit that removes a mention still reaches a hook that answers mentions.
     */
    isBotMentioned(): boolean;
    /**
     * The edit being decided, when a person edited a message instead of posting
     * a new one: set for `onMessageEdited`, and for `onMessage`, `onAppMention`,
     * or `onDirectMessage` when they decide an edit in its place. `edit.message`
     * is the message the hook receives. A hook with side effects, such as
     * `ctx.send()`, `ctx.end()`, or a decision model call, should check it so an
     * edit doesn't repeat them.
     */
    readonly edit?: SlackMessageEdit;
    /**
     * Opens a Slack code channel from this message and returns session
     * operations bound to the channel's one session. Slack links the channel
     * in this thread. Send the first turn with the returned `send`, then return
     * `null` to give the thread no turn. One author gets one code channel per
     * message, so calling it again returns the same channel. Requires
     * `codeChannels: true`, and throws for a message already in a code channel.
     */
    openCodeChannel(options?: SlackOpenCodeChannelOptions): Promise<SlackOpenedCodeChannel>;
}
/** Options for `ctx.openCodeChannel()`. */
export interface SlackOpenCodeChannelOptions {
    /** Channel name shown in Slack. Omit to let Slack name it from the message. */
    readonly name?: string;
}
/** A code channel opened by `ctx.openCodeChannel()`, bound to its one session. */
export interface SlackOpenedCodeChannel extends SlackSessionOperations {
    /** Slack channel id of the new code channel. */
    readonly channelId: string;
}
/** Interaction-scoped context handed to `slackChannel({ onInteraction })`. */
export interface SlackInteractionContext extends SlackContext, SlackSessionOperations {
}
/** Workspace-scoped context handed to `slackChannel({ onShortcut })`. */
export interface SlackShortcutContext {
    /** Slack workspace identity and raw Web API escape hatch. */
    readonly slack: SlackWorkspaceHandle;
}
/** Workspace-scoped context handed to `slackChannel({ onSlashCommand })`. */
export interface SlackSlashCommandContext {
    /** Slack workspace identity and raw Web API escape hatch. */
    readonly slack: SlackWorkspaceHandle;
}
/** Context handed to `slackChannel({ onAnswers })` before eve resumes HITL. */
export interface SlackAnswerContext extends SlackContext {
    /** Auth derived from the Slack user who submitted the signed interaction. */
    readonly defaultAuth: SessionAuthContext;
}
export interface SlackInteractionAction {
    readonly actionId: string;
    readonly value?: string;
    readonly blockId?: string;
    /**
     * `selected_option.value` for radio / select / external_select
     * widgets. `undefined` for buttons and multi-select widgets.
     */
    readonly selectedOptionValue?: string;
    /**
     * `ts` of the Slack message hosting the clicked component. Required to
     * update that message in place via `chat.update`, since `ctx.slack.threadTs`
     * resolves to the thread root (not the clicked message) for components
     * inside thread replies.
     */
    readonly messageTs?: string;
    /**
     * Slack `trigger_id` of the click. Pass it to `views.open` (for example
     * through `ctx.slack.request`) to open a modal from a message button. Slack
     * accepts it for about 3 seconds, so call `views.open` first in the handler.
     */
    readonly triggerId?: string;
    /**
     * Display label of the clicked widget: `text.text` for buttons,
     * `selected_option.text.text` for radio/static_select. Renders the
     * "answered" card without re-fetching the original request.
     */
    readonly label?: string;
    /**
     * Slack actor who triggered the interaction, letting `onInteraction`
     * handlers attribute resolutions back to the clicker without re-parsing
     * the raw payload. Always present, since Slack requires `user` on every
     * `block_actions` payload.
     */
    readonly user: SlackInteractionUser;
}
/** Slack actor on an interactive payload, mirroring `body.user`. */
export interface SlackInteractionUser {
    readonly id: string;
    /** Modern canonical display handle. */
    readonly username?: string;
    /** Legacy display handle, kept for older workspaces. */
    readonly name?: string;
}
/** Decoded Slack slash command invocation. */
export interface SlackSlashCommand {
    /** Configured command name, including its leading slash. */
    readonly command: string;
    readonly text: string;
    readonly user: SlackInteractionUser;
    readonly teamId?: string;
    readonly channelId: string;
    readonly channelName?: string;
    readonly enterpriseId?: string;
    readonly isEnterpriseInstall: boolean;
    readonly triggerId?: string;
    readonly responseUrl?: string;
}
/** Message selected through a Slack message shortcut. */
export interface SlackShortcutMessage {
    readonly text: string;
    readonly ts: string;
    readonly threadTs?: string;
    readonly userId?: string;
}
/** Decoded Slack message shortcut or global shortcut. */
export type SlackShortcut = {
    readonly type: "message_action";
    readonly callbackId: string;
    readonly triggerId: string;
    readonly user: SlackInteractionUser;
    readonly teamId?: string;
    readonly channelId: string;
    readonly message: SlackShortcutMessage;
    readonly responseUrl?: string;
} | {
    readonly type: "shortcut";
    readonly callbackId: string;
    readonly triggerId: string;
    readonly user: SlackInteractionUser;
    readonly teamId?: string;
};
/** Decoded eve-owned HITL response submitted through Slack interactivity. */
export type SlackAnswerSubmission = {
    readonly type: "block_actions";
    readonly answers: readonly ValidatedAnswer[];
    readonly actions: readonly SlackInteractionAction[];
    readonly messageTs?: string;
    readonly user: SlackInteractionUser;
} | {
    readonly type: "view_submission";
    readonly answers: readonly ValidatedAnswer[];
    readonly messageTs: string;
    readonly user: SlackInteractionUser;
};
/** Result of a Slack HITL response admission hook. Return `null` to reject. */
export type SlackAnswerResult = {
    readonly auth: SessionAuthContext | null;
} | null;
/**
 * Result of a message hook: `onMessage`, `onAppMention`, `onDirectMessage`,
 * or `onMessageEdited`. Return an object (auth may be `null`) to dispatch a
 * turn, or `null` to drop the inbound message. `context` strings are appended
 * as user messages to session history before the delivery message. `history`
 * entries are added as user and assistant turns before it; when present,
 * `threadContext` keeps its transcript and never seeds. `title` overrides the
 * workflow run title without changing the message sent to the model.
 */
export type SlackMentionResult = {
    readonly auth: SessionAuthContext | null;
    readonly context?: readonly string[];
    readonly history?: readonly SessionHistoryMessage[];
    readonly title?: string;
    /**
     * When eve shows that the agent is working on this message. `"immediate"`
     * (the default) runs the renderer chain's `received` acknowledgement and
     * shows the thread status through the turn. `"deferred"` skips the
     * `received` acknowledgement, and eve's default renderer shows no status
     * until the turn's first tool call finishes, so a turn that ends with the
     * `no_reply` tool leaves no trace in the thread.
     *
     * Mentions and DMs outside code channels get the `received` acknowledgement
     * before their hook runs, so `"deferred"` keeps their turn quiet but can't
     * take the acknowledgement back. A message that isn't deferred and joins the
     * turn shows the status again. Edits are always deferred: `status` on an
     * edit's result has no effect.
     */
    readonly status?: "immediate" | "deferred";
    /**
     * Text that tells the model how to treat this one message, such as "This
     * reply doesn't mention you. Answer only if it's meant for you." eve adds it
     * as a `<guidance>` block inside the message's `<slack_message>` or
     * `<slack_message_edit>` block, after the metadata and before `<content>`.
     *
     * The model reads guidance as eve's own annotation, outside the message
     * content. Never put user-controlled text in it.
     */
    readonly guidance?: string;
} | null;
/**
 * Alias of {@link SlackMentionResult} for the `onDirectMessage` signature,
 * so DM handlers do not read in terms of "mention".
 */
export type SlackInboundResult = SlackMentionResult;
/** {@link SlackInboundResult}, or a promise resolving to one. */
/**
 * eve's full-context Slack event handlers: the innermost link of every
 * channel's renderer chain. The default sign-in `interaction.opened` handler keeps
 * the full {@link SlackEventContext} because it owns the public link-free
 * status, which authored renderers, limited to private delivery, can't post.
 */
export type SlackChannelInternalEvents = {
    readonly [T in SlackRenderedEvent]?: SlackEventHandler<T>;
} & {
    readonly committed?: (line: CommittedLine, ctx: Parameters<SlackEventHandler<"turn.started">>[1]) => void | Promise<void>;
};
export type SlackApprovalChannel = "direct-message" | "thread";
/** Input request passed to a {@link SlackApprovalChannelResolver}. */
export type SlackApprovalRequest = Interaction;
/** Chooses the Slack destination for one input request. */
export type SlackApprovalChannelResolver = (request: SlackApprovalRequest, ctx: SessionContext) => SlackApprovalChannel | Promise<SlackApprovalChannel>;
export interface SlackChannelConfig {
    /** Slack API transport overrides: base URLs and a custom fetch. */
    readonly api?: SlackTransportOptions;
    readonly credentials?: SlackChannelCredentials;
    readonly botName?: string;
    /**
     * Chooses where each input request is delivered. Direct-message requests go to the
     * Slack user who triggered the active turn; the session thread names that reviewer
     * without exposing the request. Defaults to `"thread"` when omitted.
     */
    readonly approvalChannel?: SlackApprovalChannelResolver;
    /** Override the default webhook route path (`/eve/v1/slack`). */
    readonly route?: string;
    /** Policy for accepted messages that arrive while a turn is active. */
    readonly turnPolicy?: TurnPolicy;
    /**
     * Serves each Slack code channel as one session and answers every message in
     * it, not just mentions. Un-mentioned messages go to `onMessage`, else
     * `onAppMention` (where `ctx.isBotMentioned()` returns `false`), else the
     * default handler. Adds the code channel scopes, events, and feature flag to
     * the app manifest. Without it, eve treats a code channel like any other
     * channel and never looks one up.
     */
    readonly codeChannels?: boolean;
    /**
     * Inbound upload policy applied to file attachments before they reach
     * the harness. Violating attachments are dropped with a warning so the
     * mention's text portion still gets delivered. Pass `"disabled"` to
     * reject every attachment. Defaults to the framework's 25 MB cap with
     * unrestricted media types.
     */
    readonly uploadPolicy?: UploadPolicyInput;
    /**
     * Adds earlier replies from the current Slack thread to each triggering
     * turn. Messages are rendered with their Slack sender ids attached so a
     * multi-user transcript retains unambiguous speaker attribution. When the
     * message starts the thread's session, the same replies are added as
     * history instead: this app's replies become assistant turns. Omit this
     * option to avoid fetching thread history.
     */
    readonly threadContext?: LoadThreadContextMessagesOptions;
    /**
     * Adds to what eve attaches to each model-visible `<slack_message>`.
     */
    readonly messageContext?: {
        /**
         * Looks up each human sender with `users.info` and adds `display_name`
         * and `real_name` to their `<sender>` block, plus `email` with
         * `email: true` (`name: false` leaves names out), including
         * `threadContext` replies. The triggering author
         * is also written to `message.author` (`fullName`, `displayName`,
         * `email`) and to the default Slack auth attributes: before
         * `onAppMention` and `onDirectMessage` run, and for other channel
         * messages only once a hook delivers them.
         *
         * `true` caches results in memory per workspace and user for an hour.
         * `resolve(user, next)` owns caching instead; `next()` is the uncached
         * `users.info` call. A lookup that fails or takes over two seconds is
         * left out, and the message is still delivered.
         *
         * Adds the `users:read` scope to the app manifest, and `users:read.email`
         * with `email: true`. Off by default: names and emails then reach model
         * context, session history, and traces.
         */
        readonly users?: SlackUsersOption;
    };
    /**
     * Handles human-authored Slack messages. Specialized `onAppMention` and
     * `onDirectMessage` handlers take precedence for their event types. Other
     * channel messages are ignored when this hook is omitted. Without
     * `onMessageEdited`, this hook also decides edits to messages it would
     * receive; see `onMessageEdited`.
     */
    onMessage?(ctx: SlackInboundMessageContext, message: SlackMessage): SlackMentionResult | Promise<SlackMentionResult>;
    /**
     * Invoked when a Slack `app_mention` event arrives (only `app_mention`;
     * other event types are ignored). Decides whether to dispatch and with
     * what auth. It renders nothing: the renderer chain's `received`
     * acknowledges the mention while this hook runs. Without
     * `onMessageEdited`, it also decides edits to messages that mention the bot
     * before or after the edit.
     *
     * Return `{ auth }` to dispatch with that session auth context, or `null`
     * to drop the mention. May be sync or async; the result is awaited before
     * dispatching. Thrown errors are caught and logged and the mention is
     * dropped. Defaults to a workspace-scoped auth derivation.
     */
    onAppMention?(ctx: SlackInboundMessageContext, message: SlackMessage): SlackMentionResult | Promise<SlackMentionResult>;
    /**
     * Invoked on a direct message: a Slack `message` event with
     * `channel_type: "im"`. Subtype messages (edits, deletes, joins, etc.)
     * and bot messages (`bot_id` set, including the bot's own replies) are
     * filtered out first, so handlers only see plain user-authored DMs.
     * Decides whether to dispatch and with what auth. It renders nothing: the
     * renderer chain's `received` acknowledges the message while this hook runs.
     * Without `onMessageEdited`, it also decides edits to direct messages.
     *
     * Return `{ auth }` to dispatch with that session auth context, or `null`
     * to drop the message. May be sync or async; the result is awaited before
     * dispatching. Thrown errors are caught and logged and the message is
     * dropped. Defaults to a workspace-scoped auth derivation.
     * Requires the bot's Slack app to subscribe to `message.im` with the
     * `im:history` scope.
     */
    onDirectMessage?(ctx: SlackInboundMessageContext, message: SlackMessage): SlackMentionResult | Promise<SlackMentionResult>;
    /**
     * Invoked when a person edits one of their Slack messages in a thread that
     * already has an eve session. Bot and app edits, link unfurls, and edits
     * outside such a thread never reach it.
     *
     * Return `{ auth }` to send the edit to the session, or `null` to drop it.
     * eve sends it as a `<slack_message_edit>` block: a diff of the changed lines
     * when Slack includes the previous text, and always the full edited text. The
     * edit follows the channel's `turnPolicy` like any message: by default it
     * steers an active turn, and it starts a turn otherwise. A turn an edit
     * starts shows no status until its first tool call finishes, so pair this
     * with the `no_reply` tool to let the agent stay silent when the edit
     * changes nothing. `title`, `history`, and thread context don't apply to
     * edits, and `status` has no effect: edits are always deferred. `guidance`
     * goes into the `<slack_message_edit>` block.
     *
     * By default, the edited message goes to the hook a new message of the same
     * kind would reach: for a DM, `onDirectMessage`, then `onMessage`; for a
     * message that mentions the bot before or after the edit, `onAppMention`,
     * then `onMessage`; in a code channel, `onMessage`, then `onAppMention`;
     * otherwise `onMessage`. Without one, DMs, mentions, and code channel
     * messages use the author's workspace-scoped auth, and other edits are
     * dropped. An authored `onEvent` comes before this default. Thrown errors
     * are caught and logged and the edit is dropped. Requires the
     * `message.channels`, `message.groups`, `message.im`, and `message.mpim`
     * events, which the generated app manifest includes.
     */
    onMessageEdited?(ctx: SlackInboundMessageContext, edit: SlackMessageEdit): SlackMentionResult | Promise<SlackMentionResult>;
    /**
     * Fallback handler for signed Slack Events API callbacks. An authored
     * `onAppMention`, `onDirectMessage`, or `onMessageEdited` takes precedence
     * for events accepted by that specialized handler; otherwise the raw event
     * arrives here. When neither a specialized handler nor `onEvent` is
     * authored, mentions, DMs, and message edits retain their built-in defaults
     * and other event types are ignored.
     *
     * The handler owns control flow. Call `ctx.send(...)` zero, one, or many
     * times to start turns on Slack, and use `ctx.waitUntil(...)` for detached
     * work. The return value is ignored. Runs after the webhook has been
     * acknowledged through the host's `waitUntil` mechanism. Errors are caught
     * and logged and never fall through to another handler.
     *
     * URL verification, slash commands, and interactive payloads are not Events
     * API callbacks and do not reach this handler.
     */
    onEvent?(ctx: SlackInboundEventContext, event: SlackEvent): void | Promise<void>;
    /**
     * Handler for Slack `block_actions` interactive callbacks (button
     * clicks, select changes, etc.) **not** consumed by the framework's
     * HITL pipeline. Slack POSTs interactive payloads to the same webhook
     * route as mentions; the framework decodes them, routes any action whose
     * `action_id` starts with `eve_input:` to the runtime as an HITL
     * response (resuming a paused session), and forwards everything else
     * here, one invocation per non-HITL action.
     *
     * Runs on the inbound webhook side via `waitUntil()`, so the channel
     * returns `200 OK` immediately. Errors are caught and logged; they do
     * not affect the webhook response or sibling invocations.
     *
     * The `SlackContext` here is rebuilt from the interaction payload
     * (channel id, thread ts, team id), **not** the persisted thread state
     * used by event handlers. Use `ctx.slack.request(...)` for arbitrary
     * Slack Web API calls and `action.messageTs` to target `chat.update`.
     */
    onInteraction?(action: SlackInteractionAction, ctx: SlackInteractionContext): void | Promise<void>;
    /**
     * Handles Slack message shortcuts (`message_action`) and global shortcuts
     * (`shortcut`) with workspace-scoped Slack Web API access.
     *
     * eve returns `200 OK` immediately and keeps the handler alive through
     * `waitUntil()`. Errors are caught and logged.
     */
    onShortcut?(shortcut: SlackShortcut, ctx: SlackShortcutContext): void | Promise<void>;
    /**
     * Handles Slack slash commands configured with this channel's webhook route.
     * The command includes the configured command name, arguments, invoking user,
     * channel, workspace, trigger ID, and response URL.
     *
     * eve returns an empty `200 OK` immediately and keeps the handler alive
     * through `waitUntil()`. Errors are caught and logged.
     */
    onSlashCommand?(command: SlackSlashCommand, ctx: SlackSlashCommandContext): void | Promise<void>;
    /**
     * Authorizes an eve-owned HITL answer before the pending input resolves.
     * Return `{ auth }` to accept the response, or `null` to reject it and keep
     * the request pending. Thrown errors are logged and treated as rejection.
     *
     * When this hook is omitted, Slack preserves its built-in behavior and
     * accepts the response with the submitting user's auth, regardless of other
     * authored handlers.
     */
    onAnswers?(ctx: SlackAnswerContext, submission: SlackAnswerSubmission): SlackAnswerResult | Promise<SlackAnswerResult>;
    /**
     * Renderers that wrap eve's default Slack rendering, outermost first. Omit
     * it and eve renders with its default alone. Each renderer can acknowledge
     * messages (`received`), render session events (`events`), and shape the
     * task card (`taskCard`). A handler runs the rest of the chain, ending with
     * eve's default, by calling `next`, and skips it by not calling it.
     */
    readonly renderers?: readonly SlackRenderer[];
}
/**
 * Concrete return type of {@link slackChannel}. Named so consumers can
 * default-export a `slackChannel(...)` call under `declaration: true`
 * without TypeScript emitting an internal path for `Channel`.
 */
export interface SlackChannel extends Channel<SlackChannelState, SlackReceiveTarget, SlackInstrumentationMetadata> {
}
/**
 * Slack channel factory. Wires up the webhook route, message dispatch,
 * interaction handling, and eve's default rendering: the `Thinking...`
 * acknowledgement, status lines, replies, questions, sign-ins, errors, and a
 * live task card for each turn that starts tasks. Message hooks decide whether
 * and how to dispatch; `renderers` wrap the default rendering without
 * replacing it.
 */
export declare function slackChannel(config?: SlackChannelConfig): SlackChannel;
