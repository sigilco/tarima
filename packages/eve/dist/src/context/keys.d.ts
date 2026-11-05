/**
 * Leaf context keys — no codec, no runtime imports. Safe to import from any
 * tier. Codec-carrying keys (`ChannelKey`, `BundleKey`) live in
 * `#runtime/sessions/runtime-context-keys.ts`.
 */
import type { LanguageModel } from "ai";
import type { AgentSessionRuntimeOverrides } from "#execution/agent-sessions/runtime-overrides.js";
import type { ChannelDeliveryMetadata, ChannelInstrumentationProjection, SessionAuthContext, SessionCallback, SessionCapabilities, SessionParent, SessionTraceSeed, SessionTraceRoot, SessionTurn } from "#channel/types.js";
import { ContextKey } from "#context/key.js";
import { type StubScope } from "#tool-stubs/types.js";
import { type SessionInboxAddress } from "#execution/session-inbox/address.js";
import type { HandleEventFn } from "#harness/types.js";
import type { CrossChannelToFn } from "#channel/cross-channel-receive.js";
import type { InstrumentationChannel } from "#shared/instrumentation-channel.js";
import type { DynamicSubagentAgentConfig } from "#runtime/subagents/dynamic-agent-config.js";
import type { DynamicRemoteAgentConfig } from "#runtime/subagents/dynamic-remote-agent-config.js";
import type { DynamicRemoteBinding } from "#definitions/remote.js";
import type { SandboxAccess, SandboxSessionEndReason } from "#sandbox/state.js";
import type { RuntimeModelReference } from "#runtime/agent/bootstrap.js";
import type { PreparedRuntimeDelegationTool } from "#runtime/sessions/turn.js";
import type { SessionPredecessor } from "#protocol/session-events/families/session.js";
export type { SessionAuthContext, SessionParent, SessionTraceRoot, SessionTurn, } from "#channel/types.js";
export type { SessionPredecessor } from "#protocol/session-events/families/session.js";
/**
 * Auth metadata on the active session.
 *
 * `current` is the caller of the most recent request.
 * `initiator` is the caller who originally created the session.
 */
export interface SessionAuth {
    readonly current: SessionAuthContext | null;
    readonly initiator: SessionAuthContext | null;
}
/**
 * Internal session metadata seeded into the context container under
 * {@link SessionKey}.
 *
 * This is not the shape authored code observes. Tools, hooks, and channel
 * events receive the `SessionContext.session` projection (via `ctx.session`),
 * whose session id is exposed as `id`, not `sessionId`.
 */
export interface Session {
    readonly auth: SessionAuth;
    readonly parent?: SessionParent;
    readonly predecessor?: SessionPredecessor;
    readonly sessionId: string;
    readonly turn: SessionTurn;
}
export declare const AuthKey: ContextKey<SessionAuthContext | null>;
export declare const ToolStubsKey: ContextKey<StubScope>;
export declare const InitiatorAuthKey: ContextKey<SessionAuthContext | null>;
export declare const SessionIdKey: ContextKey<string>;
export declare const ConversationIdKey: ContextKey<string>;
export declare const SessionInboxKey: ContextKey<SessionInboxAddress>;
export declare const ContinuationTokenKey: ContextKey<string>;
/** Every channel continuation address requested for this session, in claim order. */
export declare const ContinuationHookTokensKey: ContextKey<readonly string[]>;
export declare const ChannelRequestIdKey: ContextKey<string>;
/**
 * Dev-host-verified originating-client metadata, valid only for the current
 * host secret. It carries the inherited dev-TUI hint, not editing authority.
 */
export interface LocalDevRequestProvenance {
    readonly address: string;
    readonly interactiveClient: boolean;
    readonly signature: string;
}
export declare const LocalDevRequestKey: ContextKey<LocalDevRequestProvenance>;
export declare const OccurrenceIdKey: ContextKey<string>;
/** Authored schedule whose dispatch created this session. */
export declare const ScheduleIdKey: ContextKey<string>;
export declare const ScheduleInstanceKey: ContextKey<string>;
/** Display title derived from the session's initial input. */
export declare const SessionTitleKey: ContextKey<string>;
export declare const ChannelDeliveryKey: ContextKey<ChannelDeliveryMetadata>;
/** Accepted messages whose response owns the current turn's durable stream events. */
export declare const TurnDeliveryIdsKey: ContextKey<readonly string[]>;
/** Last framework announcements recorded in the retained session history. */
export interface HistoryState {
    /** Last announced value per keyed announcement (see `#harness/announcements.js`). */
    readonly announcements?: Readonly<Record<string, string>>;
    /** The digest of the message each key's announcement last added, which a rewrite looks for. */
    readonly messages?: Readonly<Record<string, string>>;
}
export declare const HistoryStateKey: ContextKey<HistoryState>;
/**
 * The catalog tools a session's tool list has offered. Each stays offered for
 * the rest of the session, so the tool list never drops a catalog tool that
 * earlier calls named. eve's catalog definition keeps it.
 */
export interface OfferedCatalogTools {
    /** `eve__tool` mentions connected services, and `eve__search` their sign-in entries. */
    readonly connections: boolean;
    /** `eve__search` finds skills. */
    readonly searchableSkills: boolean;
    /** `eve__skill`. */
    readonly skills: boolean;
    /** `eve__tool`. */
    readonly tools: boolean;
}
export declare const ChannelInstrumentationKey: ContextKey<ChannelInstrumentationProjection>;
export declare const ParentSessionKey: ContextKey<SessionParent>;
/** Set only on a session eve started in place of one that could no longer run. */
export declare const SessionPredecessorKey: ContextKey<SessionPredecessor>;
/** Set only when the trace root differs from `ParentSessionKey`'s root; see {@link SessionTraceRoot}. */
export declare const TraceRootKey: ContextKey<SessionTraceRoot>;
/** Separate from {@link ParentSessionKey} so it stays out of what extensions read. */
export declare const ParentTraceContextKey: ContextKey<SessionTraceSeed>;
export type { SessionTraceSeed } from "#channel/types.js";
export declare const SessionTraceSeedKey: ContextKey<SessionTraceSeed>;
export declare const OtelTraceEnabledKey: ContextKey<boolean>;
/**
 * Session-level capability flags (see {@link SessionCapabilities}). Set
 * on root runs by channel routes and inherited pointwise by subagent
 * dispatch so HITL readiness flows through a conversation chain.
 */
export declare const CapabilitiesKey: ContextKey<SessionCapabilities>;
/**
 * Optional framework-owned caller callback captured when the session is created.
 */
export declare const SessionCallbackKey: ContextKey<SessionCallback>;
/**
 * The remote agent protocol of a {@link SessionCallbackKey} caller that speaks an earlier one. That
 * caller gets the session's result, but the session relays none of its requests to it.
 */
export declare const EarlierRemoteCallerKey: ContextKey<number>;
export declare const SessionKey: ContextKey<Session>;
export declare const SandboxKey: ContextKey<SandboxAccess>;
export declare const SandboxTerminalCleanupKey: ContextKey<(reason: SandboxSessionEndReason) => Promise<void>>;
export declare const HandleEventKey: ContextKey<HandleEventFn>;
/** A tool's `ctx.channel` and `ctx.to()`, which the turn running the tool provides. */
export declare const ToolChannelKey: ContextKey<{
    readonly channel: InstrumentationChannel;
    readonly to: CrossChannelToFn;
}>;
export interface LiveDynamicModelSelection {
    /** Live provider instance; absent for string selections, which resolve through the reference. */
    readonly model?: LanguageModel;
    readonly reference: RuntimeModelReference;
}
export type DurableDynamicSubagentSelection = {
    readonly agentConfig: DynamicSubagentAgentConfig;
    readonly kind: "subagent";
    readonly prepared: PreparedRuntimeDelegationTool;
    readonly remoteAgent?: never;
} | {
    readonly agentConfig?: never;
    readonly kind: "remote";
    readonly prepared: PreparedRuntimeDelegationTool;
    readonly remoteAgent: DynamicRemoteAgentConfig;
    /**
     * The binding a child opened now keeps, when the remote agent carries credentials: the steps
     * that reach the child build them again from it.
     */
    readonly binding?: DynamicRemoteBinding;
} | null;
export declare const DynamicSubagentAgentConfigKey: ContextKey<DynamicSubagentAgentConfig>;
export declare const AgentSessionRuntimeOverridesKey: ContextKey<AgentSessionRuntimeOverrides>;
/**
 * Durable state for one session-scoped dynamic skill.
 */
export interface DurableDynamicSkillMetadata {
    readonly name: string;
    /** Listed in the catalog instead of the dynamic skill announcement. */
    readonly deferred?: true;
    readonly description: string;
    /** Checkpoint storage keeps `markdown`; the authoring API uses `content`. */
    readonly markdown: string;
    /**
     * Content hash of the package files. Present only for packages with
     * supporting files, which are the only packages written to the sandbox.
     */
    readonly revision?: string;
}
/**
 * Durable map from dynamic skill name to the serialized sandbox session state
 * that holds its current manifest revision. Refreshes skip writes when the
 * revision and sandbox are unchanged; deleting the sandbox clears it.
 */
export declare const DynamicSkillSandboxKey: ContextKey<Readonly<Record<string, string>>>;
