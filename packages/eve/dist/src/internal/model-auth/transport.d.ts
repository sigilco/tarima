import { createGateway, type LanguageModel } from "ai";
export { MODEL_CONNECTION_ENV } from "#shared/model-helper.js";
export { resolveModelApiKey } from "./api-key.js";
export declare function createDirectModelFetch(provider: "openai" | "anthropic"): typeof fetch;
/** Resolve the connection for every request, including models constructed before /login. */
export declare function localGatewayModel(id: string): LanguageModel | undefined;
/** Resolve a decision model through the same local Gateway connection used by language models. */
export declare function localGatewayDecisionModel(id: string): ReturnType<ReturnType<typeof createGateway>["decisionModel"]> | undefined;
