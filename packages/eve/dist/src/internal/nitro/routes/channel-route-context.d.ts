import type { JsonValue } from "#shared/json.js";
import type { RouteHandlerArgs } from "#channel/routes.js";
import type { SkillFileSource } from "#channel/skill-files.js";
import type { RunHandle, RunInput } from "#channel/types.js";
type AgentInfoRouteResponse = () => Promise<Response>;
interface HomeRouteMetadata {
    readonly agentName: string;
}
/**
 * Creates one session from a route handler. `continuationToken` is
 * channel-local (the dispatcher prepends the channel name), so ownership
 * established here is visible to `resolveSession` on the same channel.
 */
export type RouteSessionCreator = (input: Omit<RunInput, "adapter" | "channelName" | "requestId"> & {
    /** Stable initial receipt for an idempotent HTTP creation operation. */
    readonly deliveryId?: string;
}) => Promise<RunHandle & {
    readonly deliveryId?: string;
}>;
export type RemoteAgentStreamHeadersResolver = (input: {
    readonly name: string;
    readonly resolverId?: string;
    readonly dynamicBinding?: JsonValue;
    readonly url: string;
}) => Promise<Record<string, string>>;
export declare function attachRouteChannelName<TArgs extends RouteHandlerArgs>(args: TArgs, channelName: string): TArgs;
export declare function readRouteChannelName(args: RouteHandlerArgs): string | undefined;
export declare function attachAgentInfoRouteResponse<TArgs extends RouteHandlerArgs>(args: TArgs, respond: AgentInfoRouteResponse): TArgs;
export declare function readAgentInfoRouteResponse(args: RouteHandlerArgs): AgentInfoRouteResponse | undefined;
export declare function attachHomeRouteMetadata<TArgs extends RouteHandlerArgs>(args: TArgs, metadata: HomeRouteMetadata): TArgs;
export declare function readHomeRouteMetadata(args: RouteHandlerArgs): HomeRouteMetadata | undefined;
export declare function attachRouteSessionCreator<TArgs extends RouteHandlerArgs>(args: TArgs, createSession: RouteSessionCreator): TArgs;
export declare function readRouteSessionCreator(args: RouteHandlerArgs): RouteSessionCreator | undefined;
export declare function attachRemoteAgentStreamHeadersResolver<TArgs extends RouteHandlerArgs>(args: TArgs, resolve: RemoteAgentStreamHeadersResolver): TArgs;
export declare function readRemoteAgentStreamHeadersResolver(args: RouteHandlerArgs): RemoteAgentStreamHeadersResolver | undefined;
/** The agent's skill files behind `readSkill`, for channels that serve files they already listed. */
export declare function attachSkillFileSource<TArgs extends RouteHandlerArgs>(args: TArgs, files: SkillFileSource): TArgs;
export declare function readSkillFileSource(args: RouteHandlerArgs): SkillFileSource | undefined;
export {};
