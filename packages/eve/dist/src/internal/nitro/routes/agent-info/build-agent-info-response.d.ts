import type { AgentInfoResult } from "#client/agent-info-schema.js";
import type { AgentInfoManifestData } from "#internal/nitro/routes/agent-info/load-agent-info-data.js";
import { type GatewayCredentialPresence } from "#internal/resolve-model-endpoint-status.js";
import type { ChatGptAuthState } from "#public/models/openai/chatgpt/token-broker.js";
export type AgentInfoResponse = AgentInfoResult;
/** Projects agent info exclusively from the effective compiled graph. */
export declare function buildAgentInfoResponse(data: AgentInfoManifestData, input: {
    readonly mode: "development" | "production";
    readonly gatewayCredentials: GatewayCredentialPresence;
    readonly chatgptAuth?: ChatGptAuthState;
}): AgentInfoResponse;
