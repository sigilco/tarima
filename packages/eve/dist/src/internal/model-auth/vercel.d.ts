import { type VercelSession } from "./store.js";
export declare const VERCEL_MODEL_CLIENT_ID = "cl_HYyOPBNtFMfHhaUn9L4QPfTZz6TP47bp";
export declare const VERCEL_OAUTH_ISSUER = "https://vercel.com";
export declare const VERCEL_TEAM_HEADER = "x-vercel-ai-gateway-team";
export declare function authJson(url: string, init?: RequestInit, maxBytes?: number, timeoutMs?: number): Promise<Record<string, unknown>>;
export declare function vercelApiJson(url: string, init?: RequestInit): Promise<Record<string, unknown>>;
export declare function vercelOAuthEndpoints(signal?: AbortSignal): Promise<{
    device: string;
    token: string;
}>;
export declare function sessionFromToken(value: Record<string, unknown>, previous?: VercelSession): VercelSession;
export declare function resolveVercelSession(rejectedToken?: string): Promise<VercelSession>;
export declare function validateVercelAccess(token: string, teamId: string, signal?: AbortSignal): Promise<void>;
