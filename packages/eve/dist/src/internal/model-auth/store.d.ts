import { type ModelConnectionSelection } from "#shared/model-connection.js";
export { isModelConnection, type ModelConnectionSelection } from "#shared/model-connection.js";
export interface VercelSession {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    teamId: string;
    teamName: string;
}
export declare function readModelSecret(name: string): Promise<string | undefined>;
export declare function writeModelSecret(name: string, value: string): Promise<void>;
export declare function writeVercelSession(session: VercelSession, clientId: string): Promise<void>;
export declare function readVercelSession(clientId: string): Promise<VercelSession | undefined>;
export declare function readDefaultConnection(): Promise<ModelConnectionSelection | undefined>;
export declare function writeDefaultConnection(selected: ModelConnectionSelection): Promise<void>;
export declare function modelKeySecretName(provider: "openai" | "anthropic" | "ai-gateway-key"): string;
