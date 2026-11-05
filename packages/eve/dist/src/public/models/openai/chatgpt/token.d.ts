export interface ChatGptToken {
    readonly accountId?: string;
    readonly accountLabel?: string;
    readonly expiresAt?: number;
    readonly token: string;
}
export interface ChatGptTokenResolutionInput {
    readonly forceRefresh: boolean;
    readonly now: () => number;
}
export declare class ChatGptSignedOutError extends Error {
}
export declare function isChatGptTokenFresh(token: ChatGptToken | undefined, now: number): boolean;
