export declare const CHATGPT_ISSUER = "https://auth.openai.com";
export declare const CHATGPT_CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
export declare const CHATGPT_LOGIN_HINT = "Open `/model` in `eve dev` and select ChatGPT subscription to sign in.";
export interface ChatGptRefreshCredentials {
    readonly refreshToken: string;
    readonly accountId?: string;
    readonly accountLabel?: string;
}
export interface ChatGptCredentials extends ChatGptRefreshCredentials {
    readonly accessToken: string;
    readonly expiresAt: number;
}
export declare class ChatGptSignInRequiredError extends Error {
    constructor();
}
export declare function requestChatGptTokens(parameters: Record<string, string>, options?: {
    fetch?: typeof fetch;
    signal?: AbortSignal;
    previous?: ChatGptRefreshCredentials;
    now?: () => number;
}): Promise<ChatGptCredentials>;
export declare function readChatGptAuthResponse(response: Response): Promise<unknown>;
