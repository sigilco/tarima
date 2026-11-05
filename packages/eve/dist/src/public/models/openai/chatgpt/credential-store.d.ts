import { type ChatGptCredentials, type ChatGptRefreshCredentials } from "./oauth.js";
import { type ChatGptToken, type ChatGptTokenResolutionInput } from "./token.js";
export declare class ChatGptInvalidStoredSessionError extends Error {
    constructor();
}
export interface ChatGptCredentialStore {
    read(): Promise<ChatGptRefreshCredentials | ChatGptCredentials | undefined>;
    resolveToken(input: ChatGptTokenResolutionInput & {
        readonly fetch?: typeof fetch;
    }): Promise<ChatGptToken>;
    update(callback: (current: ChatGptRefreshCredentials | ChatGptCredentials | undefined) => Promise<ChatGptCredentials>, options?: {
        replace?: boolean;
    }): Promise<ChatGptCredentials>;
}
interface SecretStore {
    get(input: {
        service: string;
        name: string;
    }): Promise<string | null>;
    set(input: {
        service: string;
        name: string;
        value: string;
    }): Promise<void>;
}
export declare function createChatGptCredentialStore(path?: string, secretStore?: SecretStore): ChatGptCredentialStore;
export declare function getDefaultChatGptCredentialStore(): ChatGptCredentialStore;
export {};
