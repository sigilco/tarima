import type { ModelRouting } from "./agent-definition.js";
import type { ModelEndpointStatus } from "./model-endpoint-status.js";
export declare const CONNECTIONS: readonly ["chatgpt", "vercel", "ai-gateway-key", "openai", "anthropic"];
export type ModelConnection = (typeof CONNECTIONS)[number];
export type ModelConnectionSelection = ModelConnection | "ai-gateway-project" | "vercel-cli";
export declare function isModelConnection(value: unknown): value is ModelConnection;
export interface ConnectedModel {
    id: string;
    routing: ModelRouting;
    endpoint: ModelEndpointStatus;
}
/** Whether a completed connection or model edit still needs runtime activation. */
export interface ModelAccessChange {
    kind: "model-access-changed";
    reload: boolean;
    model?: ConnectedModel;
}
