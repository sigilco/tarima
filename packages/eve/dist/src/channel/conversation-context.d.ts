import type { RunInput, SessionAuthContext } from "#channel/types.js";
import { type AudienceCaller, type ConversationContext, type ConversationEnvironment } from "#shared/conversation-context.js";
/** What a conversation context is built from: a run, or a direct tool call's channel and caller. */
type ConversationSource = RunInput | (Pick<RunInput, "adapter" | "auth"> & Partial<Pick<RunInput, "audienceAuth" | "channelName" | "inheritedConversation" | "parentTraceContext">>);
export declare function buildConversationContext(run: ConversationSource, environment: ConversationEnvironment): ConversationContext;
/** Projects route auth into the minimal identity audience classifiers need. */
export declare function toAudienceCaller(auth: SessionAuthContext | null | undefined): AudienceCaller;
export {};
